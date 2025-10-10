import enum
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String, Text, Uuid, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# SQLAlchemy 2.0's Uuid type handles both PostgreSQL UUID and SQLite CHAR(32)
# Automatically adapts based on database backend
UUIDType = Uuid


class JobStatus(enum.Enum):
    queued = "queued"
    processing = "processing"
    succeeded = "succeeded"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shoots = relationship("Shoot", back_populates="user")
    assets = relationship("Asset", back_populates="user")
    jobs = relationship("Job", back_populates="user")
    credits = relationship("Credit", back_populates="user", uselist=False)


class Credit(Base):
    __tablename__ = "credits"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUIDType, ForeignKey("users.id"), nullable=False, unique=True
    )
    balance = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="credits")


class Shoot(Base):
    __tablename__ = "shoots"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="shoots")
    assets = relationship("Asset", back_populates="shoot")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    shoot_id = Column(UUIDType, ForeignKey("shoots.id"), nullable=False)
    user_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shoot = relationship("Shoot", back_populates="assets")
    user = relationship("User", back_populates="assets")
    jobs = relationship("Job", back_populates="asset")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUIDType, ForeignKey("assets.id"), nullable=False)
    user_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    status = Column(SQLEnum(JobStatus), nullable=False, default=JobStatus.queued)
    output_path = Column(String(512))
    error_message = Column(Text)
    credits_used = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    asset = relationship("Asset", back_populates="jobs")
    user = relationship("User", back_populates="jobs")
    events = relationship("JobEvent", back_populates="job")


class JobEvent(Base):
    __tablename__ = "job_events"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    job_id = Column(UUIDType, ForeignKey("jobs.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    details = Column(Text)  # JSON as text for simplicity
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="events")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
