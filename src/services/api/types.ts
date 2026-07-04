export interface Chunk {
  chunkId: string
  text: string
  pageNumber?: number
  startOffset?: number
  endOffset?: number
  score: number
}

export interface Source {
  id: string
  name: string
  excerpt: string
  confidence: 'High' | 'Medium' | 'Low'
  score: number
  chunks: Chunk[]
  pageNumber?: number
  startOffset?: number
  endOffset?: number
}

export interface AnswerResult {
  id?: string  // message_id
  answer: string | null
  blocked: boolean
  sources: Source[]
  followUpQuestions?: string[]
  modelUsed?: string
  latencyMs?: number
}

export type DocumentStatus = 'ready' | 'processing' | 'failed'

export interface Document {
  id: string
  name: string
  version: string
  updatedAt: string
  status: DocumentStatus
  knowledgeBase: string
  pageCount?: number
  sizeBytes?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  lastMessage?: string
}

export type SlotStatus = 'pending' | 'uploading' | 'validating' | 'ready' | 'error'

export interface ExtractedInfo {
  vat_id?: string | null
  hrb_number?: string | null
  signatories?: string[] | null
  document_date?: string | null
  company_name?: string | null
}

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  extracted_info: ExtractedInfo
}

export interface ValidateOnboardingResponse {
  doc_type: string
  filename: string
  result: ValidationResult
}

export interface OnboardingSlot {
  slot_id: string
  doc_type: string
  label: string
  description: string
  required: boolean
  status: SlotStatus
  result?: ValidationResult
  filename?: string
}
