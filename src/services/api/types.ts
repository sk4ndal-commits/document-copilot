export interface Chunk {
  chunkId: string
  text: string
  pageNumber?: number
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
}

export interface AnswerResult {
  answer: string | null
  blocked: boolean
  sources: Source[]
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
