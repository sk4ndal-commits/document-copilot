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
    legal_doc_type: Optional[str] = None


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
    id: Optional[str] = None
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
    legal_doc_type: str
    page_count: Optional[int] = None
    size_bytes: Optional[int] = None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    id: str


class AdminStatus(BaseModel):
    data_sources: list[dict]
    last_sync: str


class AdminMetrics(BaseModel):
    validation_activity: int
    ai_usage_tokens: int
    storage_bytes: int
    avg_satisfaction: Optional[float] = None
    no_result_count: int = 0


class KnowledgeBase(BaseModel):
    id: Optional[str] = None
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: Optional[datetime] = None


class BulkUpdateDocuments(BaseModel):
    doc_ids: List[str]
    legal_doc_type: str


class FeedbackRequest(BaseModel):
    message_id: str
    feedback: int  # 1 or -1


class UserOut(BaseModel):
    id: str
    username: str
    roles: list[str]


class SummaryResponse(BaseModel):
    summary: str


class ComparisonRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str


class ComparisonResponse(BaseModel):
    comparison: str


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


class ValidationError(BaseModel):
    field: str
    message: str


class ExtractedInfo(BaseModel):
    vat_id: Optional[str] = None
    hrb_number: Optional[str] = None
    signatories: Optional[List[str]] = None
    document_date: Optional[str] = None
    company_name: Optional[str] = None


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str]
    extracted_info: ExtractedInfo


class OnboardingSlotStatus(str, Enum):
    pending = "pending"
    uploading = "uploading"
    validating = "validating"
    ready = "ready"
    error = "error"


class OnboardingDocumentSlot(BaseModel):
    slot_id: str
    doc_type: str
    label: str
    status: OnboardingSlotStatus = OnboardingSlotStatus.pending
    result: Optional[ValidationResult] = None


class OnboardingSession(BaseModel):
    id: str
    slots: List[OnboardingDocumentSlot]
    created_at: datetime


class ValidateOnboardingResponse(BaseModel):
    doc_type: str
    filename: str
    result: ValidationResult
