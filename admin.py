from collections import defaultdict
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_admin
from ..models import (
    Booking,
    BookingStatus,
    Event,
    EventStatus,
    Notification,
    NotificationType,
    User
)
from ..schemas import (
    AdminDashboardResponse,
    AdminRoleUpdate,
    AdminUserResponse,
    AdminUserStatusUpdate,
    BookingResponse,
    EventResponse
)
from ..services.event_service import notify_event_bookers


# =========================
# Admin Router
# =========================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN DASHBOARD
# ADMIN only
# =========================================================

@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse
)
def get_admin_dashboard(
    start_date: datetime | None = Query(
        default=None,
        description="Start date/time for analytics filtering"
    ),
    end_date: datetime | None = Query(
        default=None,
        description="End date/time for analytics filtering"
    ),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # =========================
    # Date validation
    # =========================

    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be later than end_date"
        )

    # =========================
    # Base booking query
    # =========================

    booking_query = db.query(Booking).filter(
        Booking.booking_status == BookingStatus.CONFIRMED
    )

    if start_date is not None:
        booking_query = booking_query.filter(
            Booking.created_at >= start_date
        )

    if end_date is not None:
        booking_query = booking_query.filter(
            Booking.created_at <= end_date
        )

    confirmed_bookings = booking_query.all()

    # =========================
    # Dashboard totals
    # =========================

    total_users = db.query(User).count()

    total_events = db.query(Event).count()

    total_bookings = len(
        confirmed_bookings
    )

    total_tickets_sold = sum(
        booking.ticket_quantity
        for booking in confirmed_bookings
    )

    total_revenue = sum(
        booking.total_price
        for booking in confirmed_bookings
    )

    # =========================
    # Event lookup
    # =========================

    events = {
        event.id: event.title
        for event in db.query(Event).all()
    }

    # =========================
    # Daily Sales
    # =========================

    daily_sales_data = defaultdict(
        lambda: {
            "tickets_sold": 0,
            "revenue": 0.0,
            "bookings": 0
        }
    )

    for booking in confirmed_bookings:
        date_key = booking.created_at.strftime(
            "%Y-%m-%d"
        )

        daily_sales_data[
            date_key
        ]["tickets_sold"] += (
            booking.ticket_quantity
        )

        daily_sales_data[
            date_key
        ]["revenue"] += (
            booking.total_price
        )

        daily_sales_data[
            date_key
        ]["bookings"] += 1

    daily_sales = []

    for date_key in sorted(
        daily_sales_data.keys()
    ):
        data = daily_sales_data[
            date_key
        ]

        daily_sales.append(
            {
                "date": date_key,
                "tickets_sold": data[
                    "tickets_sold"
                ],
                "revenue": round(
                    data["revenue"],
                    2
                ),
                "bookings": data[
                    "bookings"
                ]
            }
        )

    # =========================
    # Monthly Booking Trends
    # =========================

    monthly_data = defaultdict(
        lambda: {
            "bookings": 0,
            "tickets_sold": 0,
            "revenue": 0.0
        }
    )

    for booking in confirmed_bookings:
        month_key = booking.created_at.strftime(
            "%Y-%m"
        )

        monthly_data[
            month_key
        ]["bookings"] += 1

        monthly_data[
            month_key
        ]["tickets_sold"] += (
            booking.ticket_quantity
        )

        monthly_data[
            month_key
        ]["revenue"] += (
            booking.total_price
        )

    monthly_booking_trends = []

    for month_key in sorted(
        monthly_data.keys()
    ):
        data = monthly_data[
            month_key
        ]

        monthly_booking_trends.append(
            {
                "month": month_key,
                "bookings": data[
                    "bookings"
                ],
                "tickets_sold": data[
                    "tickets_sold"
                ],
                "revenue": round(
                    data["revenue"],
                    2
                )
            }
        )

    # =========================
    # Popular Events
    # =========================

    popular_event_data = defaultdict(
        lambda: {
            "tickets_sold": 0,
            "bookings": 0
        }
    )

    for booking in confirmed_bookings:
        popular_event_data[
            booking.event_id
        ]["tickets_sold"] += (
            booking.ticket_quantity
        )

        popular_event_data[
            booking.event_id
        ]["bookings"] += 1

    popular_events = []

    for event_id, data in (
        popular_event_data.items()
    ):
        popular_events.append(
            {
                "event_id": event_id,
                "event_title": events.get(
                    event_id,
                    "Unknown Event"
                ),
                "tickets_sold": data[
                    "tickets_sold"
                ],
                "bookings": data[
                    "bookings"
                ]
            }
        )

    popular_events.sort(
        key=lambda item: (
            item["tickets_sold"],
            item["bookings"]
        ),
        reverse=True
    )

    # =========================
    # Top Revenue Events
    # =========================

    revenue_event_data = defaultdict(
        lambda: {
            "revenue": 0.0,
            "tickets_sold": 0,
            "bookings": 0
        }
    )

    for booking in confirmed_bookings:
        revenue_event_data[
            booking.event_id
        ]["revenue"] += (
            booking.total_price
        )

        revenue_event_data[
            booking.event_id
        ]["tickets_sold"] += (
            booking.ticket_quantity
        )

        revenue_event_data[
            booking.event_id
        ]["bookings"] += 1

    top_revenue_events = []

    for event_id, data in (
        revenue_event_data.items()
    ):
        top_revenue_events.append(
            {
                "event_id": event_id,
                "event_title": events.get(
                    event_id,
                    "Unknown Event"
                ),
                "revenue": round(
                    data["revenue"],
                    2
                ),
                "tickets_sold": data[
                    "tickets_sold"
                ],
                "bookings": data[
                    "bookings"
                ]
            }
        )

    top_revenue_events.sort(
        key=lambda item: item["revenue"],
        reverse=True
    )

    # =========================
    # Final Dashboard Response
    # =========================

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_tickets_sold": total_tickets_sold,
        "total_bookings": total_bookings,
        "total_revenue": round(
            total_revenue,
            2
        ),
        "daily_sales": daily_sales,
        "monthly_booking_trends": monthly_booking_trends,
        "popular_events": popular_events[:10],
        "top_revenue_events": top_revenue_events[:10]
    }


# =========================================================
# ADMIN USER MANAGEMENT
# =========================================================


# =========================
# List All Users
# =========================

@router.get(
    "/users",
    response_model=list[AdminUserResponse]
)
def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User)
        .order_by(User.id)
        .all()
    )

    return users


# =========================
# Get User By ID
# =========================

@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse
)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


# =========================
# Change User Role
# =========================

@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse
)
def update_user_role(
    user_id: int,
    role_data: AdminRoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    user.role = role_data.role

    db.commit()
    db.refresh(user)

    return user


# =========================
# Activate / Deactivate User
# =========================

@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse
)
def update_user_status(
    user_id: int,
    status_data: AdminUserStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own account status"
        )

    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# ADMIN EVENT MANAGEMENT
# =========================================================


# =========================
# List All Events
# =========================

@router.get(
    "/events",
    response_model=list[EventResponse]
)
def get_all_events(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .order_by(Event.id)
        .all()
    )

    return events


# =========================
# Get Event By ID
# =========================

@router.get(
    "/events/{event_id}",
    response_model=EventResponse
)
def get_event_by_id(
    event_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return event


# =========================
# Cancel Event
# =========================

@router.patch(
    "/events/{event_id}/cancel",
    response_model=EventResponse
)
def cancel_event(
    event_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.event_status == EventStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is already cancelled"
        )

    if event.event_status == EventStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed event cannot be cancelled"
        )

    event.event_status = EventStatus.CANCELLED

    # Notify confirmed bookers.
    notify_event_bookers(
        db=db,
        event=event,
        title="Event Cancelled",
        message=(
            f"The event '{event.title}' has been cancelled "
            "by the administrator."
        )
    )

    db.commit()
    db.refresh(event)

    return event


# =========================================================
# ADMIN BOOKING MANAGEMENT
# =========================================================


# =========================
# List All Bookings
# =========================

@router.get(
    "/bookings",
    response_model=list[BookingResponse]
)
def get_all_bookings(
    booking_status: BookingStatus | None = Query(
        default=None,
        description="Filter bookings by status"
    ),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    booking_query = db.query(Booking)

    if booking_status is not None:
        booking_query = booking_query.filter(
            Booking.booking_status == booking_status
        )

    bookings = (
        booking_query
        .order_by(Booking.id)
        .all()
    )

    return bookings


# =========================
# Get Booking By ID
# =========================

@router.get(
    "/bookings/{booking_id}",
    response_model=BookingResponse
)
def get_booking_by_id(
    booking_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking


# =========================
# Cancel Booking
# =========================

@router.patch(
    "/bookings/{booking_id}/cancel",
    response_model=BookingResponse
)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.booking_status == BookingStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )

    if booking.booking_status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed bookings can be cancelled"
        )

    # Restore the tickets to the event.
    event = (
        db.query(Event)
        .filter(Event.id == booking.event_id)
        .first()
    )

    if event is not None:
        event.available_tickets += booking.ticket_quantity

        # Prevent available tickets from exceeding
        # the original total ticket capacity.
        if event.available_tickets > event.total_tickets:
            event.available_tickets = event.total_tickets

    booking.booking_status = BookingStatus.CANCELLED

    # Create notification for the booking owner.
    notification = Notification(
        user_id=booking.user_id,
        title="Booking Cancelled",
        message=(
            f"Your booking #{booking.id} has been cancelled "
            "by the administrator."
        ),
        type=NotificationType.BOOKING,
        is_read=False
    )

    db.add(notification)

    db.commit()
    db.refresh(booking)

    return booking