from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

connect_args = {}
url = settings.DATABASE_URL

# SQLite needs this flag when used with multiple threads (scheduler + request threads).
if url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Render (and some hosts) hand out "postgres://" URLs; SQLAlchemy 2.x wants "postgresql://".
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
