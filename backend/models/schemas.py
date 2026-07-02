from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class DocumentStatus(str, Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class SearchRequest(BaseModel):
    query: str
    knowledge_base: Optional[str] = None


class Chunk(BaseModel):
    chunk_id: str
    text: str
    page_number: Optional[int] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    score: float


class Source(BaseModel):
    id: str
    name: str
    excerpt: str
    confidence: str
    score: float
    chunks: list[Chunk]
    page_number: Optional[int] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None


class AnswerResult(BaseModel):
    answer: Optional[str] = None
    blocked: bool = False
    sources: list[Source]
    follow_up_questions: list[str] = []
    model_used: Optional[str] = None
    latency_ms: Optional[int] = None


class DocumentOut(BaseModel):
    id: str
    name: str
    version: str
    updated_at: str
    status: DocumentStatus
    knowledge_base: str
    page_count: Optional[int] = None
    size_bytes: Optional[int] = None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    id: str


class AdminStatus(BaseModel):
    data_sources: list[dict]
    last_sync: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    last_message: Optional[str] = None

    class Config:
        from_attributes = True


class ChatHistoryRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
