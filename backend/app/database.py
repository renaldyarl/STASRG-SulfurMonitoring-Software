import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

logger = logging.getLogger(__name__)

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
    except SQLAlchemyError:
        db_ready = False
        logger.exception("Failed to initialize database")
        print("--- App will run without persistence ---")


async def dispose_db():
    """Dispose the engine's connection pool on shutdown."""
    await engine.dispose()
