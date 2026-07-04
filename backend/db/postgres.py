import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from models.schemas import DocumentStatus

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/knowledge_copilot")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    version = Column(String, default="v1")
    updated_at = Column(String, nullable=False)
    status = Column(SAEnum(DocumentStatus), default=DocumentStatus.processing)
    knowledge_base = Column(String, nullable=False)
    page_count = Column(Integer, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True)
    tenant_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    feedback = Column(Integer, nullable=True)  # 1 for up, -1 for down
    is_no_result = Column(Boolean, default=False)
    conversation = relationship("Conversation", back_populates="messages")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    tenant_id = Column(String, nullable=False)  # Associates user with a tenant


class OnboardingSessionRecord(Base):
    __tablename__ = "onboarding_sessions"

    id = Column(String, primary_key=True)
    tenant_id = Column(String, nullable=False, index=True)
    client_name = Column(String, nullable=True)
    share_token = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    slots = relationship("OnboardingSlotRecord", back_populates="session", cascade="all, delete-orphan")


class OnboardingSlotRecord(Base):
    __tablename__ = "onboarding_slots"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("onboarding_sessions.id"), nullable=False)
    slot_id = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    required = Column(Boolean, default=True)
    status = Column(String, default="pending")
    filename = Column(String, nullable=True)
    validation_result = Column(JSONB, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    session = relationship("OnboardingSessionRecord", back_populates="slots")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
