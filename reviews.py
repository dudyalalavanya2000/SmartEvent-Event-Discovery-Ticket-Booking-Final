
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_user
from ..models import Booking, BookingStatus, Event, Review, User
from ..schemas import (
    ReviewCreate,
    ReviewResponse,
    ReviewSummary,
    ReviewUpdate,
)

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


def normalize_value(value):
    """Return an enum's value or a plain string."""
    return value.value if hasattr(value, "value") else value


# =========================
# Create Event Review
# =========================

@router.post(
    "/events/{event_id}",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    event_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # A review is allowed only after the event has finished.
    if event.event_date > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can review this event only after it has ended.",
        )

    # The user must have a confirmed booking for this event.
    booking = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.event_id == event_id,
            Booking.booking_status == BookingStatus.CONFIRMED.value,
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A confirmed booking is required to review this event.",
        )

    existing_review = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.event_id == event_id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this event.",
        )

    new_review = Review(
        user_id=current_user.id,
        event_id=event_id,
        rating=review_data.rating,
        comment=review_data.comment.strip(),
    )

    if not new_review.comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review comment cannot be empty.",
        )

    db.add(new_review)

    try:
        db.commit()
        db.refresh(new_review)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this event.",
        )

    return new_review


# =========================
# List Reviews for an Event
# =========================

@router.get(
    "/events/{event_id}",
    response_model=list[ReviewResponse],
)
def get_event_reviews(
    event_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    return (
        db.query(Review)
        .filter(Review.event_id == event_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================
# Event Rating Summary
# =========================

@router.get(
    "/events/{event_id}/summary",
    response_model=ReviewSummary,
)
def get_event_review_summary(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    result = (
        db.query(
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(Review.event_id == event_id)
        .first()
    )

    average_rating = float(result[0] or 0.0)
    review_count = int(result[1] or 0)

    return ReviewSummary(
        event_id=event_id,
        average_rating=round(average_rating, 2),
        review_count=review_count,
    )


# =========================
# Current User's Reviews
# =========================

@router.get(
    "/my-reviews",
    response_model=list[ReviewResponse],
)
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    return (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )


# =========================
# Update Own Review
# =========================

@router.patch(
    "/{review_id}",
    response_model=ReviewResponse,
)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
        .first()
    )

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or you do not have permission to edit it.",
        )

    updates = review_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a rating or comment to update.",
        )

    if "comment" in updates:
        cleaned_comment = updates["comment"].strip()

        if not cleaned_comment:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Review comment cannot be empty.",
            )

        updates["comment"] = cleaned_comment

    for field, value in updates.items():
        setattr(review, field, value)

    review.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(review)

    return review


# =========================
# Delete Own Review
# =========================

@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
        .first()
    )

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or you do not have permission to delete it.",
        )

    db.delete(review)
    db.commit()

    return None
