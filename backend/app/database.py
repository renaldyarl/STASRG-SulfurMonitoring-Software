"""Async SQLAlchemy engine, session factory, and startup/shutdown helpers.

DB failures at startup are intentionally non-fatal: the app still boots and
simply serves no persistence (mirroring the serial-open-fail behavior in
api.py). The `db_ready` flag lets CRUD calls no-op when the DB never came up.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Set to True once tables are created successfully at startup.
db_ready = False


async def init_db():
    """Create tables if they don't exist. Logs and continues on failure."""
    global db_ready
    # Import models so they are registered on Base.metadata before create_all.
    from app import models  # noqa: F401

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        db_ready = True
        print("--- SUCCESS: Database connected and tables ready ---")
    except Exception as e:
        db_ready = False
        print(f"Failed to initialize database: {e}")
        print("--- App will run without persistence ---")


async def dispose_db():
    """Dispose the engine's connection pool on shutdown."""
    await engine.dispose()
