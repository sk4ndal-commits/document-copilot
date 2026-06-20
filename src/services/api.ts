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

// All backend calls live here. Swap mock data for real fetch() calls.

export async function fetchAnswer(query: string, _knowledgeBase: string | null = null): Promise<AnswerResult> {
  // TODO: replace with real API call
  // const res = await apiFetch('/api/search', {
  //   method: 'POST',
  //   body: JSON.stringify({ query, knowledge_base: knowledgeBase }),
  // })
  // return res.json()

  await new Promise(r => setTimeout(r, 600))

  if (query.toLowerCase().includes('salary') || query.toLowerCase().includes('salaries')) {
    return { answer: null, blocked: true, sources: [] }
  }

  return {
    answer: `French warranty claims must be processed within 14 days.\n\nSteps:\n1. Verify invoice\n2. Create service ticket\n3. Notify regional team`,
    blocked: false,
    sources: [
      {
        id: '1',
        name: 'Warranty_Handbook_2025.pdf',
        excerpt: '"French warranty claims must be submitted with original invoice..."',
        confidence: 'High',
        score: 0.92,
        pageNumber: 12,
        chunks: [
          { chunkId: '1a', text: 'French warranty claims must be submitted with original invoice within 14 days of the service date.', pageNumber: 12, score: 0.92 },
          { chunkId: '1b', text: 'All warranty requests for French customers must include the product serial number and purchase date.', pageNumber: 13, score: 0.87 },
        ],
      },
      {
        id: '2',
        name: 'CRM_Process.docx',
        excerpt: '"Create a service ticket in CRM under category FR-WARRANTY..."',
        confidence: 'High',
        score: 0.88,
        chunks: [
          { chunkId: '2a', text: 'Create a service ticket in CRM under category FR-WARRANTY with priority set to Normal unless escalated.', score: 0.88 },
        ],
      },
      {
        id: '3',
        name: 'Service_Guidelines.pdf',
        excerpt: '"Regional team must be notified within 48 hours..."',
        confidence: 'Medium',
        score: 0.74,
        pageNumber: 5,
        chunks: [
          { chunkId: '3a', text: 'Regional team must be notified within 48 hours of ticket creation for all French warranty cases.', pageNumber: 5, score: 0.74 },
        ],
      },
    ],
    modelUsed: 'kimi',
    latencyMs: 612,
  }
}

export async function fetchDocuments(): Promise<Document[]> {
  // TODO: replace with real API call
  // const res = await apiFetch('/api/documents')
  // return res.json()

  return [
    { id: '1', name: 'Warranty_Handbook.pdf', version: 'v3', updatedAt: '2025-01-10', status: 'ready', knowledgeBase: 'Quality Management', pageCount: 42, sizeBytes: 1240000 },
    { id: '2', name: 'ISO9001_Audit.pdf', version: 'v1', updatedAt: '2025-03-05', status: 'ready', knowledgeBase: 'ISO Documents', pageCount: 88, sizeBytes: 3100000 },
    { id: '3', name: 'Employee_Handbook.docx', version: 'v2', updatedAt: '2024-11-20', status: 'ready', knowledgeBase: 'HR Policies', sizeBytes: 540000 },
    { id: '4', name: 'Service_Manual_X.pdf', version: 'v5', updatedAt: '2025-06-01', status: 'processing', knowledgeBase: 'Service Manuals', pageCount: 120, sizeBytes: 5800000 },
  ]
}

export async function uploadDocument(_file: File, _knowledgeBase: string): Promise<{ id: string }> {
  // TODO: replace with real API call
  // const form = new FormData()
  // form.append('file', file)
  // form.append('knowledge_base', knowledgeBase)
  // const res = await apiFetch('/api/documents/upload', { method: 'POST', body: form })
  // return res.json()

  await new Promise(r => setTimeout(r, 800))
  return { id: String(Date.now()) }
}

export async function deleteDocument(_id: string): Promise<void> {
  // TODO: replace with real API call
  // await apiFetch(`/api/documents/${id}`, { method: 'DELETE' })
  await new Promise(r => setTimeout(r, 300))
}

export async function fetchIngestionStatus(_id: string): Promise<Document> {
  // TODO: replace with real API call
  // const res = await apiFetch(`/api/documents/${id}/status`)
  // return res.json()

  await new Promise(r => setTimeout(r, 500))
  return {
    id: _id,
    name: 'Service_Manual_X.pdf',
    version: 'v5',
    updatedAt: '2025-06-01',
    status: 'ready',
    knowledgeBase: 'Service Manuals',
  }
}

// Auth wrapper — replace getToken() with your Keycloak/OIDC adapter
function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}
