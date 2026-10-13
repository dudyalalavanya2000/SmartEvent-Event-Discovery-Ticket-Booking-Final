
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import (
    Base,
    engine,
    migrate_event_lifecycle,
    migrate_event_management,
    migrate_rbac,
    migrate_user_status,
)
from .dependencies import get_current_user
from .models import Coupon, Payment, Review, User
from .routes.admin import router as admin_router
from .routes.auth import router as auth_router
from .routes.bookings import router as bookings_router
from .routes.coupons import router as coupons_router
from .routes.events import router as events_router
from .routes.notifications import router as notifications_router
from .routes.payments import router as payments_router
from .routes.reviews import router as reviews_router
from .routes.tickets import router as tickets_router
from .routes.users import router as users_router
from .schemas import UserResponse


# =========================
# Create Database Tables
# =========================
# Import all models before create_all().
# Existing tables and data are preserved.

Base.metadata.create_all(bind=engine)


# =========================
# Run Existing Migrations
# =========================

migrate_rbac()
migrate_user_status()
migrate_event_management()
migrate_event_lifecycle()


# =========================
# FastAPI Application
# =========================

app = FastAPI(
    title=(
        "SmartEvent - Event Discovery "
        "& Ticket Booking System"
    ),
    version="1.0.0",
    description=(
        "SmartEvent API for event discovery, "
        "ticket booking, payments, digital tickets, "
        "coupon discounts, and event reviews."
    ),
)


# =========================
# CORS Configuration
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# API Routers
# =========================

app.include_router(auth_router, prefix="/api/v1")
app.include_router(events_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(tickets_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")


# =========================
# Static QR Code Files
# =========================

app.mount(
    "/qr-codes",
    StaticFiles(directory="generated_qr_codes"),
    name="qr-codes",
)


# =========================
# Root Endpoint
# =========================

@app.get("/")
def root():
    return {
        "message": "SmartEvent API is running"
    }


# =========================
# Current User Profile
# =========================

@app.get(
    "/api/v1/users/me",
    response_model=UserResponse,
    tags=["Users"],
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user
