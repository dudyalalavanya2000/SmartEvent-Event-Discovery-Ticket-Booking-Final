
import uuid
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
    Notification,
    NotificationType,
    Payment,
    PaymentMethod,
    PaymentStatus,
    Ticket,
    User,
)
from ..schemas import PaymentResponse, PaymentSimulationRequest
from ..services.qr_service import generate_qr_code


router = APIRouter(prefix="/payments", tags=["Payments"])


def get_status_value(value):
    """Support enum values and strings stored in the database."""
    return value.value if hasattr(value, "value") else value


def validate_coupon_for_payment(
    coupon: Coupon,
    booking: Booking,
) -> None:
    """Revalidate a coupon before confirming a discounted booking."""
    now = datetime.utcnow()

    if not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The coupon is no longer active. Payment was not completed.",
        )

    if now < coupon.valid_from or now > coupon.expires_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The coupon is no longer valid. Payment was not completed.",
        )

    if coupon.used_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The coupon usage limit has been reached. Payment was not completed.",
        )

    if booking.original_price < coupon.minimum_order_amount:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The booking no longer meets the coupon's minimum order amount.",
        )

    discount_type = get_status_value(coupon.discount_type)

    if discount_type == DiscountType.PERCENTAGE.value:
        if coupon.discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The coupon has an invalid discount configuration.",
            )
        expected_discount = (
            booking.original_price * coupon.discount_value / 100
        )
    elif discount_type == DiscountType.FIXED.value:
        expected_discount = coupon.discount_value
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The coupon has an unsupported discount type.",
        )

    if coupon.maximum_discount is not None:
        expected_discount = min(
            expected_discount,
            coupon.maximum_discount,
        )

    expected_discount = round(
        min(expected_discount, booking.original_price),
        2,
    )

    if round(booking.discount_amount, 2) != expected_discount:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The booking discount no longer matches the coupon.",
        )


@router.post(
    "/booking/{booking_id}",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Create a pending simulated payment for the user's booking."""
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if get_status_value(booking.booking_status) != BookingStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bookings can start a payment.",
        )

    existing_payment = (
        db.query(Payment)
        .filter(Payment.booking_id == booking_id)
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A payment record already exists for this booking.",
        )

    payment = Payment(
        booking_id=booking.id,
        payment_method=PaymentMethod.SIMULATION.value,
        payment_status=PaymentStatus.PENDING.value,
        amount=booking.total_price,
    )

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the payment.",
        )

    return payment


@router.post(
    "/{payment_id}/simulate",
    response_model=PaymentResponse,
)
def simulate_payment(
    payment_id: int,
    payment_request: PaymentSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Simulate payment success or failure without charging real money."""
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == payment.booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if get_status_value(payment.payment_status) != PaymentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This payment has already been processed.",
        )

    if get_status_value(booking.booking_status) != BookingStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking is no longer pending.",
        )

    event = (
        db.query(Event)
        .filter(Event.id == booking.event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    coupon = None

    if booking.coupon_id is not None:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == booking.coupon_id)
            .with_for_update()
            .first()
        )

        if coupon is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The booking coupon no longer exists.",
            )

    if payment_request.simulate_success:
        event_status = get_status_value(event.event_status)

        if event_status != EventStatus.UPCOMING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This event is no longer available for booking.",
            )

        if coupon is not None:
            validate_coupon_for_payment(coupon, booking)

        try:
            # Only reserve tickets when the payment succeeds.
            updated_rows = (
                db.query(Event)
                .filter(
                    Event.id == event.id,
                    Event.available_tickets >= booking.ticket_quantity,
                    Event.event_status == EventStatus.UPCOMING.value,
                )
                .update(
                    {
                        Event.available_tickets: (
                            Event.available_tickets - booking.ticket_quantity
                        )
                    },
                    synchronize_session=False,
                )
            )

            if updated_rows != 1:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Not enough tickets are available. "
                        "Payment was not completed."
                    ),
                )

            payment.payment_status = PaymentStatus.SUCCESS.value
            payment.transaction_id = (
                f"SIM-{uuid.uuid4().hex[:16].upper()}"
            )
            booking.booking_status = BookingStatus.CONFIRMED.value

            # Count coupon use only in the successful payment transaction.
            if coupon is not None:
                coupon.used_count += 1

            existing_ticket = (
                db.query(Ticket)
                .filter(Ticket.booking_id == booking.id)
                .first()
            )

            if existing_ticket is None:
                ticket_code = f"TICKET-{uuid.uuid4().hex[:12].upper()}"
                qr_code_url = generate_qr_code(ticket_code)

                db.add(
                    Ticket(
                        booking_id=booking.id,
                        ticket_code=ticket_code,
                        qr_code_url=str(qr_code_url),
                    )
                )

            message = (
                f"Your payment for {event.title} was successful. "
                "Your booking is confirmed and your ticket is ready."
            )
            notification_title = "Payment Successful"

        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not process the simulated payment.",
            )

    else:
        payment.payment_status = PaymentStatus.FAILED.value
        payment.transaction_id = f"SIM-{uuid.uuid4().hex[:16].upper()}"
        booking.booking_status = BookingStatus.CANCELLED.value

        message = (
            f"Your simulated payment for {event.title} failed. "
            "No tickets or coupon usage were deducted."
        )
        notification_title = "Payment Failed"

    notification = Notification(
        user_id=current_user.id,
        title=notification_title,
        message=message,
        type=NotificationType.PAYMENT.value,
        created_at=datetime.utcnow(),
    )
    db.add(notification)

    try:
        db.commit()
        db.refresh(payment)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not process the simulated payment.",
        )

    return payment


@router.get("/my-payments", response_model=list[PaymentResponse])
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Return the current user's payment history."""
    return (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """Return a payment belonging to the current user."""
    payment = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(
            Payment.id == payment_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    return payment
