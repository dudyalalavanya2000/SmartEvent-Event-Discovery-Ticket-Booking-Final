
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import (
    get_current_user,
    require_organizer_or_admin,
)
from ..models import Coupon, DiscountType, User
from ..schemas import (
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)


router = APIRouter(
    prefix="/coupons",
    tags=["Coupons"],
)


def calculate_discount(
    coupon: Coupon,
    order_amount: float,
) -> float:
    """Calculate a coupon discount without exceeding the order amount."""

    if coupon.discount_type == DiscountType.PERCENTAGE.value:
        discount = order_amount * coupon.discount_value / 100

        if coupon.maximum_discount is not None:
            discount = min(discount, coupon.maximum_discount)

    else:
        discount = coupon.discount_value

    discount = min(discount, order_amount)

    return round(max(discount, 0.0), 2)


def validate_coupon(
    coupon: Coupon,
    order_amount: float,
) -> str | None:
    """Return an error message when a coupon cannot be applied."""

    now = datetime.utcnow()

    if not coupon.is_active:
        return "This coupon is inactive."

    if now < coupon.valid_from:
        return "This coupon is not active yet."

    if now > coupon.expires_at:
        return "This coupon has expired."

    if coupon.used_count >= coupon.usage_limit:
        return "This coupon has reached its usage limit."

    if order_amount < coupon.minimum_order_amount:
        return (
            "Minimum order amount is "
            f"{coupon.minimum_order_amount:.2f}."
        )

    if (
        coupon.discount_type == DiscountType.PERCENTAGE.value
        and coupon.discount_value > 100
    ):
        return "Percentage discount cannot exceed 100%."

    return None


# =========================
# Create Coupon
# Organizer / Admin only
# =========================

@router.post(
    "/",
    response_model=CouponResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_coupon(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    code = coupon_data.code.strip().upper()

    if not code:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Coupon code cannot be empty.",
        )

    if (
        coupon_data.discount_type == DiscountType.PERCENTAGE
        and coupon_data.discount_value > 100
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Percentage discount cannot exceed 100.",
        )

    if coupon_data.expires_at <= coupon_data.valid_from:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Expiry date must be later than the start date.",
        )

    existing_coupon = (
        db.query(Coupon)
        .filter(Coupon.code == code)
        .first()
    )

    if existing_coupon:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A coupon with this code already exists.",
        )

    coupon = Coupon(
        code=code,
        description=coupon_data.description.strip(),
        discount_type=coupon_data.discount_type.value,
        discount_value=coupon_data.discount_value,
        minimum_order_amount=coupon_data.minimum_order_amount,
        maximum_discount=coupon_data.maximum_discount,
        usage_limit=coupon_data.usage_limit,
        used_count=0,
        valid_from=coupon_data.valid_from,
        expires_at=coupon_data.expires_at,
        is_active=coupon_data.is_active,
        created_by=current_user.id,
    )

    db.add(coupon)

    try:
        db.commit()
        db.refresh(coupon)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create coupon. Check whether the code already exists.",
        )

    return coupon


# =========================
# List Active Coupons
# Authenticated users
# =========================

@router.get("/", response_model=list[CouponResponse])
def list_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()

    return (
        db.query(Coupon)
        .filter(
            Coupon.is_active.is_(True),
            Coupon.valid_from <= now,
            Coupon.expires_at >= now,
            Coupon.used_count < Coupon.usage_limit,
        )
        .order_by(Coupon.created_at.desc())
        .all()
    )


# =========================
# Validate Coupon
# Authenticated users
# =========================

@router.post(
    "/validate",
    response_model=CouponValidateResponse,
)
def validate_coupon_endpoint(
    request: CouponValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = request.code.strip().upper()

    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == code)
        .first()
    )

    if coupon is None:
        return CouponValidateResponse(
            valid=False,
            code=code,
            original_amount=round(request.order_amount, 2),
            discount_amount=0.0,
            final_amount=round(request.order_amount, 2),
            message="Coupon code not found.",
        )

    error_message = validate_coupon(
        coupon,
        request.order_amount,
    )

    if error_message:
        return CouponValidateResponse(
            valid=False,
            code=code,
            original_amount=round(request.order_amount, 2),
            discount_amount=0.0,
            final_amount=round(request.order_amount, 2),
            message=error_message,
        )

    discount = calculate_discount(
        coupon,
        request.order_amount,
    )

    return CouponValidateResponse(
        valid=True,
        code=code,
        original_amount=round(request.order_amount, 2),
        discount_amount=discount,
        final_amount=round(
            request.order_amount - discount,
            2,
        ),
        message="Coupon applied successfully.",
    )


# =========================
# Get Coupon Details
# Organizer / Admin only
# =========================

@router.get(
    "/{coupon_id}",
    response_model=CouponResponse,
)
def get_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .first()
    )

    if coupon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found.",
        )

    return coupon
