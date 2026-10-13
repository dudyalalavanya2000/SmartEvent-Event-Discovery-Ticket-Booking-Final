
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import (
    BookingStatus,
    DiscountType,
    EventCategory,
    EventStatus,
    NotificationType,
    PaymentMethod,
    PaymentStatus,
    UserRole,
)


# =========================
# User Schemas
# =========================

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# =========================
# Event Schemas
# =========================

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category: EventCategory
    location: str = Field(..., min_length=2, max_length=255)
    event_date: datetime
    ticket_price: float = Field(..., ge=0)
    banner_image: str | None = Field(default=None, max_length=500)
    total_tickets: int = Field(default=100, gt=0)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    category: EventCategory | None = None
    location: str | None = Field(default=None, min_length=2, max_length=255)
    event_date: datetime | None = None
    ticket_price: float | None = Field(default=None, ge=0)
    banner_image: str | None = Field(default=None, max_length=500)
    total_tickets: int | None = Field(default=None, gt=0)


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organizer_id: int
    title: str
    description: str
    category: EventCategory
    location: str
    event_date: datetime
    ticket_price: float
    banner_image: str | None
    total_tickets: int
    available_tickets: int
    event_status: EventStatus
    created_at: datetime


# =========================
# Organizer Booking Insights
# =========================

class EventBookingInsight(BaseModel):
    event_id: int
    event_title: str
    total_tickets: int
    tickets_sold: int
    remaining_tickets: int
    booking_count: int
    total_revenue: float


# =========================
# Coupon Schemas
# =========================

class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    description: str = Field(..., min_length=3, max_length=255)
    discount_type: DiscountType
    discount_value: float = Field(..., gt=0)
    minimum_order_amount: float = Field(default=0.0, ge=0)
    maximum_discount: float | None = Field(default=None, gt=0)
    usage_limit: int = Field(default=100, gt=0)
    valid_from: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = True


class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    description: str
    discount_type: DiscountType
    discount_value: float
    minimum_order_amount: float
    maximum_discount: float | None
    usage_limit: int
    used_count: int
    valid_from: datetime
    expires_at: datetime
    is_active: bool
    created_by: int
    created_at: datetime


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    order_amount: float = Field(..., gt=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    original_amount: float
    discount_amount: float
    final_amount: float
    message: str


# =========================
# Booking Schemas
# =========================

class BookingCreate(BaseModel):
    event_id: int = Field(..., gt=0)
    ticket_quantity: int = Field(..., gt=0, le=10)
    coupon_code: str | None = Field(default=None, max_length=50)


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    event_id: int
    ticket_quantity: int
    original_price: float = 0.0
    discount_amount: float = 0.0
    coupon_id: int | None = None
    total_price: float
    booking_status: BookingStatus
    created_at: datetime


# =========================
# Payment Schemas
# =========================

class PaymentSimulationRequest(BaseModel):
    # This is a simulation, not a real financial transaction.
    # True simulates success; False simulates failure.
    simulate_success: bool = True


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    transaction_id: str | None
    amount: float
    created_at: datetime


# =========================
# Ticket Schemas
# =========================

class TicketResponse(BaseModel):
    id: int
    booking_id: int
    ticket_code: str
    qr_code_url: str
    created_at: datetime

    ticket_quantity: int
    total_price: float

    event_id: int
    event_title: str
    event_description: str
    event_category: EventCategory
    event_location: str
    event_date: datetime
    ticket_price: float


# =========================
# Notification Schemas
# =========================

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime


# =========================
# Admin Dashboard Schemas
# =========================

class DailySalesResponse(BaseModel):
    date: str
    tickets_sold: int
    revenue: float
    bookings: int


class MonthlyBookingTrendResponse(BaseModel):
    month: str
    bookings: int
    tickets_sold: int
    revenue: float


class PopularEventResponse(BaseModel):
    event_id: int
    event_title: str
    tickets_sold: int
    bookings: int


class TopRevenueEventResponse(BaseModel):
    event_id: int
    event_title: str
    revenue: float
    tickets_sold: int
    bookings: int


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_events: int
    total_tickets_sold: int
    total_bookings: int
    total_revenue: float

    daily_sales: list[DailySalesResponse]
    monthly_booking_trends: list[MonthlyBookingTrendResponse]
    popular_events: list[PopularEventResponse]
    top_revenue_events: list[TopRevenueEventResponse]


# =========================
# Admin User Management
# =========================

class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class AdminRoleUpdate(BaseModel):
    role: UserRole


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


# =========================
# Event Review & Rating Schemas
# =========================

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=1000)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, min_length=1, max_length=1000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    event_id: int
    rating: int
    comment: str
    created_at: datetime
    updated_at: datetime


class ReviewSummary(BaseModel):
    event_id: int
    average_rating: float
    review_count: int
