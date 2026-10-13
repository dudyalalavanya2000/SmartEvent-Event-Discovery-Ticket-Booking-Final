
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import (
    require_any_authenticated_user,
    require_organizer,
)
from ..models import (
    Booking,
    BookingStatus,
    Event,
    EventStatus,
    User,
)
from ..schemas import (
    BookingResponse,
    EventBookingInsight,
    EventCreate,
    EventResponse,
    EventUpdate,
)
from ..services.event_service import (
    notify_event_bookers,
    refresh_event_lifecycle,
    update_all_event_lifecycles,
)


router = APIRouter(prefix="/events", tags=["Events"])


# =========================
# Helpers
# =========================

def normalize_category(category):
    """Return the database category in the API's enum format."""
    if category is None:
        return None

    value = getattr(category, "value", category)
    value = str(value).strip().upper()

    aliases = {
        "MUSIC": "MUSIC",
        "TECH": "TECH",
        "SPORTS": "SPORTS",
        "BUSINESS": "BUSINESS",
    }

    return aliases.get(value, value)


def event_response(event):
    """Convert legacy category values to valid API enum values."""
    data = {
        column.name: getattr(event, column.name)
        for column in Event.__table__.columns
    }

    data["category"] = normalize_category(event.category)
    return EventResponse.model_validate(data)


# =========================
# Create Event
# ORGANIZER only
# =========================

@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    new_event = Event(
        organizer_id=current_user.id,
        title=event_data.title,
        description=event_data.description,
        category=event_data.category.value,
        location=event_data.location,
        event_date=event_data.event_date,
        ticket_price=event_data.ticket_price,
        banner_image=event_data.banner_image,
        total_tickets=event_data.total_tickets,
        available_tickets=event_data.total_tickets,
        event_status=EventStatus.UPCOMING.value,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return event_response(new_event)


# =========================
# Advanced Event Search
# USER / ORGANIZER / ADMIN
# =========================

@router.get("/", response_model=list[EventResponse])
def get_events(
    category: str | None = Query(
        default=None,
        description="Filter by category: Music, Tech, Sports, Business",
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        description="Search event titles and descriptions",
    ),
    location: str | None = Query(
        default=None,
        min_length=1,
        description="Filter by city or location text",
    ),
    min_price: float | None = Query(
        default=None,
        ge=0,
        description="Minimum ticket price",
    ),
    max_price: float | None = Query(
        default=None,
        ge=0,
        description="Maximum ticket price",
    ),
    start_date: datetime | None = Query(
        default=None,
        description="Include events on or after this date/time (ISO format)",
    ),
    end_date: datetime | None = Query(
        default=None,
        description="Include events on or before this date/time (ISO format)",
    ),
    sort_by: str = Query(
        default="event_date",
        description="Sort by event_date, ticket_price, or title",
    ),
    sort_order: str = Query(
        default="asc",
        description="Sort order: asc or desc",
    ),
    skip: int = Query(
        default=0,
        ge=0,
        description="Number of events to skip",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of events to return (1-100)",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_authenticated_user),
):
    update_all_event_lifecycles(db)

    # Validate filters
    if category:
        normalized_filter = normalize_category(category)

        if normalized_filter not in {
            "MUSIC",
            "TECH",
            "SPORTS",
            "BUSINESS",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category. Use Music, Tech, Sports, or Business.",
            )
    else:
        normalized_filter = None

    if min_price is not None and max_price is not None:
        if min_price > max_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="min_price cannot be greater than max_price",
            )

    if start_date is not None and end_date is not None:
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date cannot be later than end_date",
            )

    sort_by = sort_by.strip().lower()
    sort_order = sort_order.strip().lower()

    allowed_sort_fields = {
        "event_date": Event.event_date,
        "ticket_price": Event.ticket_price,
        "title": Event.title,
    }

    if sort_by not in allowed_sort_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort_by. Use event_date, ticket_price, or title.",
        )

    if sort_order not in {"asc", "desc"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort_order. Use asc or desc.",
        )

    query = db.query(Event)

    # Category filter
    if normalized_filter:
        query = query.filter(
            func.upper(Event.category) == normalized_filter
        )

    # Search titles and descriptions
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(keyword),
                Event.description.ilike(keyword),
            )
        )

    # Location filter
    if location:
        query = query.filter(
            Event.location.ilike(f"%{location.strip()}%")
        )

    # Ticket price filters
    if min_price is not None:
        query = query.filter(Event.ticket_price >= min_price)

    if max_price is not None:
        query = query.filter(Event.ticket_price <= max_price)

    # Date range filters
    if start_date is not None:
        query = query.filter(Event.event_date >= start_date)

    if end_date is not None:
        query = query.filter(Event.event_date <= end_date)

    # Sorting
    sort_column = allowed_sort_fields[sort_by]

    if sort_order == "desc":
        query = query.order_by(sort_column.desc(), Event.id.asc())
    else:
        query = query.order_by(sort_column.asc(), Event.id.asc())

    # Pagination
    events = query.offset(skip).limit(limit).all()

    return [event_response(event) for event in events]


# =========================
# Get My Events
# ORGANIZER only
# =========================

@router.get("/my-events", response_model=list[EventResponse])
def get_my_events(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    update_all_event_lifecycles(db)

    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .order_by(Event.event_date.asc())
        .all()
    )

    return [event_response(event) for event in events]


# =========================
# Organizer Booking Insights
# ORGANIZER only
# =========================

@router.get(
    "/my-events/insights",
    response_model=list[EventBookingInsight],
)
def get_my_event_insights(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    update_all_event_lifecycles(db)

    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .order_by(Event.event_date.asc())
        .all()
    )

    insights = []

    for event in events:
        confirmed_bookings = (
            db.query(Booking)
            .filter(
                Booking.event_id == event.id,
                Booking.booking_status == BookingStatus.CONFIRMED.value,
            )
            .all()
        )

        tickets_sold = sum(
            booking.ticket_quantity for booking in confirmed_bookings
        )
        total_revenue = sum(
            booking.total_price for booking in confirmed_bookings
        )

        insights.append(
            EventBookingInsight(
                event_id=event.id,
                event_title=event.title,
                total_tickets=event.total_tickets,
                tickets_sold=tickets_sold,
                remaining_tickets=event.available_tickets,
                booking_count=len(confirmed_bookings),
                total_revenue=round(total_revenue, 2),
            )
        )

    return insights


# =========================
# Get Event Bookings
# ORGANIZER only
# =========================

@router.get(
    "/{event_id}/bookings",
    response_model=list[BookingResponse],
)
def get_event_bookings(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    refresh_event_lifecycle(event, db)

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view bookings for your own events",
        )

    return (
        db.query(Booking)
        .filter(Booking.event_id == event_id)
        .order_by(Booking.created_at.desc())
        .all()
    )


# =========================
# Get Event By ID
# USER / ORGANIZER / ADMIN
# =========================

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_authenticated_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    refresh_event_lifecycle(event, db)
    return event_response(event)


# =========================
# Update Own Event
# ORGANIZER only
# =========================

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    refresh_event_lifecycle(event, db)

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own events",
        )

    current_status = str(
        getattr(event.event_status, "value", event.event_status)
    ).upper()

    if current_status == EventStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled events cannot be updated",
        )

    if current_status == EventStatus.ONGOING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ongoing events cannot be updated",
        )

    if current_status == EventStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed events cannot be updated",
        )

    update_data = event_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No event fields were provided for update",
        )

    if "total_tickets" in update_data:
        booked_tickets = event.total_tickets - event.available_tickets
        new_total_tickets = update_data["total_tickets"]

        if new_total_tickets < booked_tickets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Total tickets cannot be less than "
                    f"already booked tickets ({booked_tickets})"
                ),
            )

        event.available_tickets = new_total_tickets - booked_tickets

    for field, value in update_data.items():
        if field == "category" and value is not None:
            setattr(event, field, value.value)
        elif field != "total_tickets":
            setattr(event, field, value)

    if "total_tickets" in update_data:
        event.total_tickets = update_data["total_tickets"]

    event.event_status = EventStatus.UPCOMING.value
    db.flush()

    notify_event_bookers(
        db=db,
        event=event,
        title="Event Updated",
        message=(
            f"The event '{event.title}' has been updated by the organizer. "
            "Please check the latest event details."
        ),
    )

    db.commit()
    db.refresh(event)

    return event_response(event)


# =========================
# Cancel Own Event
# ORGANIZER only
# =========================

@router.patch("/{event_id}/cancel", response_model=EventResponse)
def cancel_event(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    refresh_event_lifecycle(event, db)

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own events",
        )

    current_status = str(
        getattr(event.event_status, "value", event.event_status)
    ).upper()

    if current_status == EventStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is already cancelled",
        )

    if current_status == EventStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed events cannot be cancelled",
        )

    if current_status == EventStatus.ONGOING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ongoing events cannot be cancelled",
        )

    event.event_status = EventStatus.CANCELLED.value

    notify_event_bookers(
        db=db,
        event=event,
        title="Event Cancelled",
        message=(
            f"The event '{event.title}' has been cancelled by the organizer."
        ),
    )

    db.commit()
    db.refresh(event)

    return event_response(event)
