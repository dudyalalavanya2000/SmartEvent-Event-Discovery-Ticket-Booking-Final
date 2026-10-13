from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..models import (
    Booking,
    BookingStatus,
    Event,
    EventStatus,
    Notification,
    NotificationType,
)


def update_event_lifecycle(event: Event) -> bool:
    """
    Automatically update event status based on event date.

    UPCOMING:
        Before event start time.

    ONGOING:
        From event start time until 2 hours after start.

    COMPLETED:
        More than 2 hours after event start.

    CANCELLED:
        Never changed automatically.
    """

    if event.event_status == EventStatus.CANCELLED:
        return False

    now = datetime.utcnow()

    event_start = event.event_date
    event_end = event_start + timedelta(hours=2)

    if now < event_start:
        new_status = EventStatus.UPCOMING
    elif event_start <= now < event_end:
        new_status = EventStatus.ONGOING
    else:
        new_status = EventStatus.COMPLETED

    if event.event_status == new_status:
        return False

    event.event_status = new_status
    return True


def refresh_event_lifecycle(
    event: Event,
    db: Session
) -> Event:
    """
    Refresh an event's lifecycle status and persist
    the change if required.
    """

    changed = update_event_lifecycle(event)

    if changed:
        db.commit()
        db.refresh(event)

    return event


def update_all_event_lifecycles(db: Session) -> None:
    """
    Refresh lifecycle status for all events.

    Useful before returning event lists or analytics.
    """

    events = db.query(Event).all()

    changed = False

    for event in events:
        if update_event_lifecycle(event):
            changed = True

    if changed:
        db.commit()


def notify_event_bookers(
    db: Session,
    event: Event,
    title: str,
    message: str
) -> None:
    """
    Send an event notification to all users who have
    confirmed bookings for the event.
    """

    user_ids = (
        db.query(Booking.user_id)
        .filter(
            Booking.event_id == event.id,
            Booking.booking_status == BookingStatus.CONFIRMED
        )
        .distinct()
        .all()
    )

    for (user_id,) in user_ids:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=NotificationType.EVENT,
            is_read=False
        )

        db.add(notification)