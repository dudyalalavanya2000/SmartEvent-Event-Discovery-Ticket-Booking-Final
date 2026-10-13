
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_any_authenticated_user
from ..models import (
    Booking,
    BookingStatus,
    Event,
    Notification,
    NotificationType,
    User,
)
from ..schemas import NotificationResponse


router = APIRouter(prefix="/notifications", tags=["Notifications"])


def create_event_reminders(current_user: User, db: Session) -> None:
    now = datetime.utcnow()
    reminder_limit = now + timedelta(hours=24)

    upcoming_bookings = (
        db.query(Booking, Event)
        .join(Event, Booking.event_id == Event.id)
        .filter(
            Booking.user_id == current_user.id,
            Booking.booking_status == BookingStatus.CONFIRMED.value,
            Event.event_date >= now,
            Event.event_date <= reminder_limit,
        )
        .all()
    )

    for booking, event in upcoming_bookings:
        reminder_message = (
            f"Reminder: '{event.title}' is happening "
            f"on {event.event_date.strftime('%d-%m-%Y at %I:%M %p')}. "
            "You have a confirmed booking for this event."
        )

        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.type == NotificationType.EVENT.value,
                Notification.title == "Upcoming Event Reminder",
                Notification.message == reminder_message,
            )
            .first()
        )

        if existing is None:
            db.add(
                Notification(
                    user_id=current_user.id,
                    title="Upcoming Event Reminder",
                    message=reminder_message,
                    type=NotificationType.EVENT.value,
                    is_read=False,
                )
            )

    db.commit()


@router.get("/", response_model=list[NotificationResponse])
def get_my_notifications(
    notification_type: str | None = Query(default=None, alias="type"),
    is_read: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    if notification_type is not None:
        notification_type = notification_type.upper()
        valid_types = {item.value for item in NotificationType}

        if notification_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type. Choose from: {', '.join(sorted(valid_types))}",
            )

    create_event_reminders(current_user, db)

    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    if notification_type is not None:
        query = query.filter(Notification.type == notification_type)

    if is_read is not None:
        query = query.filter(Notification.is_read.is_(is_read))

    return (
        query.order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    create_event_reminders(current_user, db)

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return {"unread_count": count}


@router.patch("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {Notification.is_read: True},
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": count,
    }


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.patch(
    "/{notification_id}/unread",
    response_model=NotificationResponse,
)
def mark_notification_as_unread(
    notification_id: int,
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = False
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(require_any_authenticated_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully",
        "notification_id": notification_id,
    }
