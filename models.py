
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


# =========================
# Enums
# =========================

class UserRole(str, Enum):
    USER = "USER"
    ORGANIZER = "ORGANIZER"
    ADMIN = "ADMIN"


class EventCategory(str, Enum):
    MUSIC = "MUSIC"
    TECH = "TECH"
    SPORTS = "SPORTS"
    BUSINESS = "BUSINESS"


class EventStatus(str, Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PaymentMethod(str, Enum):
    SIMULATION = "SIMULATION"


class NotificationType(str, Enum):
    EVENT = "EVENT"
    BOOKING = "BOOKING"
    SYSTEM = "SYSTEM"
    PAYMENT = "PAYMENT"


class DiscountType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


# =========================
# User Model
# =========================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), default=UserRole.USER.value, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Event Model
# =========================

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    organizer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    description: Mapped[str] = mapped_column(
        String, nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    location: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    event_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )
    ticket_price: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    banner_image: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    total_tickets: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    available_tickets: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    event_status: Mapped[str] = mapped_column(
        String(30),
        default=EventStatus.UPCOMING.value,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Coupon Model
# =========================

class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    description: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    discount_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    discount_value: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    minimum_order_amount: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    maximum_discount: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    usage_limit: Mapped[int] = mapped_column(
        Integer, default=100, nullable=False
    )
    used_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    valid_from: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Booking Model
# =========================

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id"), nullable=False
    )
    ticket_quantity: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    original_price: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    discount_amount: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    total_price: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    coupon_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("coupons.id"), nullable=True
    )
    booking_status: Mapped[str] = mapped_column(
        String(30),
        default=BookingStatus.PENDING.value,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Ticket Model
# =========================

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id"),
        unique=True, nullable=False
    )
    ticket_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    qr_code_url: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Payment Model
# =========================

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id"),
        index=True, nullable=False
    )
    payment_method: Mapped[str] = mapped_column(
        String(30),
        default=PaymentMethod.SIMULATION.value,
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        String(30),
        default=PaymentStatus.PENDING.value,
        nullable=False,
    )
    transaction_id: Mapped[str | None] = mapped_column(
        String(100), unique=True, index=True, nullable=True
    )
    amount: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Notification Model
# =========================

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    message: Mapped[str] = mapped_column(
        String, nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(30),
        default=NotificationType.SYSTEM.value,
        nullable=False,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


# =========================
# Event Review Model
# =========================

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "event_id",
            name="uq_review_user_event",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    comment: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
