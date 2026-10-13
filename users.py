
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_admin
from ..models import User, UserRole
from ..schemas import UserResponse


# =========================
# Users Router
# =========================

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================
# Update User Role
# ADMIN only
# =========================

@router.patch(
    "/{user_id}/role",
    response_model=UserResponse
)
def update_user_role(
    user_id: int,
    role: UserRole,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find the target user
    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from accidentally changing
    # their own role.
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    # Update role
    user.role = role

    db.commit()
    db.refresh(user)

    return user
