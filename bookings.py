
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_user
from ..models import (
    Booking,
    BookingStatus,
    Coupon,
    DiscountType,
    Event,
    EventStatus,
    User,
)
from ..schemas import BookingCreate, BookingResponse
from ..services.event_service import update_event_lifecycle


router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_status_value(value):
    """Support enum values and strings stored in the database."""
    return value.value if hasattr(value, "value") else value


def calculate_coupon_discount(coupon: Coupon, amount: float) -> float:
    """Validate a coupon and calculate its discount."""
    now = datetime.utcnow()

    if not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon is inactive.",
        )

    if now < coupon.valid_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon is not valid yet.",
        )

    if now > coupon.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon has expired.",
        )

    if coupon.used_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon has reached its usage limit.",
        )

    if amount < coupon.minimum_order_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Minimum order amount for this coupon is "
                f"{coupon.minimum_order_amount:.2f}."
            ),
        )

    discount_type = get_status_value(coupon.discount_type)

    if discount_type == DiscountType.PERCENTAGE.value:
        if coupon.discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid percentage discount configured for this coupon.",
            )

        discount = amount * coupon.discount_value / 100

    elif discount_type == DiscountType.FIXED.value:
        discount = coupon.discount_value

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported coupon discount type.",
        )

    if coupon.maximum_discount is not None:
        discount = min(discount, coupon.maximum_discount)

    # A discount cannot exceed the original order amount.
    discount = min(discount, amount)

    return round(max(discount, 0), 2)


@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    event = (
        db.query(Event)
        .filter(Event.id == booking_data.event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    lifecycle_changed = update_event_lifecycle(event)

    if lifecycle_changed:
        db.commit()
        db.refresh(event)

    event_status = get_status_value(event.event_status)

    if event_status == EventStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled events cannot be booked.",
        )

    if event_status == EventStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed events cannot be booked.",
        )

    if event_status == EventStatus.ONGOING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ongoing events cannot be booked.",
        )

    if event_status != EventStatus.UPCOMING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This event is not currently available for booking.",
        )

    if event.available_tickets <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is sold out.",
        )

    if booking_data.ticket_quantity > event.available_tickets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only {event.available_tickets} tickets "
                "are currently available."
            ),
        )

    # Always calculate prices on the backend.
    original_price = round(
        float(event.ticket_price) * booking_data.ticket_quantity,
        2,
    )
    discount_amount = 0.0
    coupon_id = None

    coupon_code = (
        booking_data.coupon_code.strip().upper()
        if booking_data.coupon_code
        else ""
    )

    if coupon_code:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == coupon_code)
            .first()
        )

        if coupon is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon code not found.",
            )

        discount_amount = calculate_coupon_discount(
            coupon,
            original_price,
        )
        coupon_id = coupon.id

    final_price = round(original_price - discount_amount, 2)

    # Coupon usage is NOT incremented here.
    # Tickets and coupon usage are updated only after payment succeeds.
    new_booking = Booking(
        user_id=current_user.id,
        event_id=event.id,
        ticket_quantity=booking_data.ticket_quantity,
        original_price=original_price,
        discount_amount=discount_amount,
        coupon_id=coupon_id,
        total_price=final_price,
        booking_status=BookingStatus.PENDING.value,
    )

    try:
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the booking.",
        )

    return new_booking


@router.get(
    "/my-bookings",
    response_model=list[BookingResponse],
)
def get_my_bookings(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_booking(
    booking_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    return booking
