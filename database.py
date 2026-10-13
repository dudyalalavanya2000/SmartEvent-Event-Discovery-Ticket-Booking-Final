from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "sqlite:///./smartevent.db"


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    }
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


# =========================
# Database Dependency
# =========================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================
# RBAC Migration
# =========================

def migrate_rbac():
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    if "role" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN role VARCHAR(20)
                    NOT NULL
                    DEFAULT 'USER'
                    """
                )
            )

        print(
            "RBAC migration completed: "
            "role column added."
        )

    else:
        print(
            "RBAC migration skipped: "
            "role column already exists."
        )


# =========================
# User Active Status Migration
# =========================

def migrate_user_status():
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    if "is_active" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN is_active BOOLEAN
                    NOT NULL
                    DEFAULT 1
                    """
                )
            )

        print(
            "User status migration completed: "
            "is_active column added."
        )

    else:
        print(
            "User status migration skipped: "
            "is_active column already exists."
        )


# =========================
# Event Management Migration
# =========================

def migrate_event_management():
    inspector = inspect(engine)

    if "events" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("events")
    }

    if "organizer_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE events
                    ADD COLUMN organizer_id INTEGER
                    NOT NULL
                    DEFAULT 1
                    """
                )
            )

        print(
            "Module 8 migration: "
            "organizer_id column added."
        )

    else:
        print(
            "Module 8 migration skipped: "
            "organizer_id already exists."
        )

    if "event_status" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE events
                    ADD COLUMN event_status VARCHAR(20)
                    NOT NULL
                    DEFAULT 'ACTIVE'
                    """
                )
            )

        print(
            "Module 8 migration: "
            "event_status column added."
        )

    else:
        print(
            "Module 8 migration skipped: "
            "event_status already exists."
        )


# =========================
# Event Lifecycle Migration
# =========================

def migrate_event_lifecycle():
    inspector = inspect(engine)

    if "events" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("events")
    }

    if "event_status" not in columns:
        return

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                UPDATE events
                SET event_status = 'UPCOMING'
                WHERE event_status = 'ACTIVE'
                """
            )
        )

    converted = result.rowcount or 0

    if converted:
        print(
            "Module 10 migration completed: "
            f"{converted} ACTIVE event(s) "
            "converted to UPCOMING."
        )
    else:
        print(
            "Module 10 migration skipped: "
            "no ACTIVE events found."
        )