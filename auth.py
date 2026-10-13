from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..auth.security import (
    create_access_token,
    hash_password,
    verify_password
)
from ..database import get_db
from ..models import User, UserRole
from ..schemas import TokenResponse, UserRegister, UserResponse


# =========================
# Authentication Router
# =========================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# Register
# =========================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    # Check username
    existing_username = (
        db.query(User)
        .filter(
            User.username == user_data.username
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check email
    existing_email = (
        db.query(User)
        .filter(
            User.email == user_data.email
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # New users are USER by default
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        role=UserRole.USER
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================
# Login
# =========================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.email == form_data.username
        )
        .first()
    )

    # Validate credentials
    if user is None or not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # Convert role safely.
    # Existing SQLite records may return role as a string.
    if isinstance(user.role, UserRole):
        user_role = user.role.value
    else:
        user_role = str(user.role)

    # Create JWT with user ID and role
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user_role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    } 