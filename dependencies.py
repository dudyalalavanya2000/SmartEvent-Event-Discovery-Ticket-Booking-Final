from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .auth.security import decode_access_token
from .database import get_db
from .models import User, UserRole


# =========================
# OAuth2 Configuration
# =========================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


# =========================
# Get Current User
# =========================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (ValueError, TypeError):
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    # =========================
    # Check User Account Status
    # =========================

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


# =========================
# Role-Based Access Control
# =========================

def require_roles(
    *allowed_roles: UserRole
) -> Callable:

    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        # SQLite may return the role as a plain string.
        # Normalize it to UserRole before checking.
        try:
            current_role = (
                current_user.role
                if isinstance(
                    current_user.role,
                    UserRole
                )
                else UserRole(
                    str(current_user.role)
                )
            )

        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )

        if current_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Access denied. Required role: "
                    + ", ".join(
                        role.value
                        for role in allowed_roles
                    )
                )
            )

        return current_user

    return role_checker


# =========================
# Role Dependencies
# =========================

require_user = require_roles(
    UserRole.USER
)

require_organizer = require_roles(
    UserRole.ORGANIZER
)

require_admin = require_roles(
    UserRole.ADMIN
)


# =========================
# Multiple Role Dependencies
# =========================

require_user_or_organizer = require_roles(
    UserRole.USER,
    UserRole.ORGANIZER
)

require_organizer_or_admin = require_roles(
    UserRole.ORGANIZER,
    UserRole.ADMIN
)

require_any_authenticated_user = require_roles(
    UserRole.USER,
    UserRole.ORGANIZER,
    UserRole.ADMIN
)