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
