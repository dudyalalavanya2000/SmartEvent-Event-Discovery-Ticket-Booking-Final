
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_organizer_or_admin, require_user
from ..models import (
    Booking,
    BookingStatus,
    Event,
    EventCategory,
    Ticket,
    User,
)
from ..schemas import TicketResponse
from ..services.qr_service import generate_qr_code


router = APIRouter(prefix="/tickets", tags=["Tickets"])


def normalize_event_category(category):
    """
    Normalize legacy category strings for ticket responses.
    Event creation and update validation remain unchanged.
    """
    value = category.value if hasattr(category, "value") else str(category)
    normalized = value.strip().upper()

    aliases = {
        "TECH": "TECH",
        "TECHNOLOGY": "TECH",
        "MUSIC": "MUSIC",
        "SPORTS": "SPORTS",
        "SPORT": "SPORTS",
        "BUSINESS": "BUSINESS",
    }

    return aliases.get(normalized, value)


def build_ticket_response(ticket: Ticket, booking: Booking, event: Event):
    return {
        "id": ticket.id,
        "booking_id": ticket.booking_id,
        "ticket_code": ticket.ticket_code,
        "qr_code_url": ticket.qr_code_url,
        "created_at": ticket.created_at,
        "ticket_quantity": booking.ticket_quantity,
        "total_price": booking.total_price,
        "event_id": event.id,
        "event_title": event.title,
        "event_description": event.description,
        "event_category": normalize_event_category(event.category),
        "event_location": event.location,
        "event_date": event.event_date,
        "ticket_price": event.ticket_price,
    }


def get_booking_status_value(booking_status):
    """Return a consistent string for enum or string statuses."""
    if hasattr(booking_status, "value"):
        return booking_status.value
    return str(booking_status)


@router.post(
    "/booking/{booking_id}",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
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
            detail="Booking not found",
        )

    if get_booking_status_value(booking.booking_status) != get_booking_status_value(
        BookingStatus.CONFIRMED
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket can only be generated for a confirmed booking",
        )

    event = db.query(Event).filter(Event.id == booking.event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    existing_ticket = (
        db.query(Ticket)
        .filter(Ticket.booking_id == booking.id)
        .first()
    )

    if existing_ticket:
        return build_ticket_response(existing_ticket, booking, event)

    ticket_code = f"TICKET-{uuid.uuid4().hex[:12].upper()}"
    qr_code_path = generate_qr_code(ticket_code)

    new_ticket = Ticket(
        booking_id=booking.id,
        ticket_code=ticket_code,
        qr_code_url=qr_code_path,
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return build_ticket_response(new_ticket, booking, event)


@router.get("/my-tickets", response_model=list[TicketResponse])
def get_my_tickets(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Ticket, Booking, Event)
        .join(Booking, Ticket.booking_id == Booking.id)
        .join(Event, Booking.event_id == Event.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )

    return [
        build_ticket_response(ticket, booking, event)
        for ticket, booking, event in results
    ]


@router.get("/verify/{ticket_code}")
def verify_ticket(
    ticket_code: str,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.ticket_code == ticket_code)
        .first()
    )

    if ticket is None:
        return {
            "valid": False,
            "message": "Invalid ticket. Ticket not found.",
            "ticket_code": ticket_code,
        }

    booking = (
        db.query(Booking)
        .filter(Booking.id == ticket.booking_id)
        .first()
    )

    if booking is None:
        return {
            "valid": False,
            "message": "Invalid ticket. Booking not found.",
            "ticket_code": ticket_code,
        }

    event = db.query(Event).filter(Event.id == booking.event_id).first()

    if event is None:
        return {
            "valid": False,
            "message": "Invalid ticket. Event not found.",
            "ticket_code": ticket_code,
        }

    booking_status = get_booking_status_value(booking.booking_status)
    confirmed_status = get_booking_status_value(BookingStatus.CONFIRMED)

    if booking_status != confirmed_status:
        return {
            "valid": False,
            "message": "Ticket is not valid because the booking is not confirmed.",
            "ticket_code": ticket_code,
            "booking_status": booking_status,
        }

    return {
        "valid": True,
        "message": "Ticket verified successfully.",
        "ticket_code": ticket.ticket_code,
        "ticket_id": ticket.id,
        "booking_id": booking.id,
        "booking_status": booking_status,
        "ticket_quantity": booking.ticket_quantity,
        "total_price": booking.total_price,
        "event": {
            "id": event.id,
            "title": event.title,
            "category": normalize_event_category(event.category),
            "location": event.location,
            "event_date": event.event_date,
            "ticket_price": event.ticket_price,
        },
    }


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    result = (
        db.query(Ticket, Booking, Event)
        .join(Booking, Ticket.booking_id == Booking.id)
        .join(Event, Booking.event_id == Event.id)
        .filter(
            Ticket.id == ticket_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    ticket, booking, event = result
    return build_ticket_response(ticket, booking, event)
