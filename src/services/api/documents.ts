import { apiFetch } from './client'
import { Document } from './types'

export async function fetchDocuments(): Promise<Document[]> {
  const res = await apiFetch('/api/documents')
  if (!res.ok) {
    throw new Error('Failed to fetch documents')
  }
  const data = await res.json()

  return data.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
    version: doc.version,
    updatedAt: doc.updated_at,
    status: doc.status,
    knowledgeBase: doc.knowledge_base,
    pageCount: doc.page_count,
    sizeBytes: doc.size_bytes,
  }))
}

export async function uploadDocument(file: File, knowledgeBase: string): Promise<{ id: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('knowledge_base', knowledgeBase)

  const res = await apiFetch('/api/documents/upload', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error('Upload failed')
  }
  return res.json()
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error('Delete failed')
  }
}

export async function fetchIngestionStatus(id: string): Promise<Document> {
  const res = await apiFetch(`/api/documents/${id}/status`)
  if (!res.ok) {
    throw new Error('Failed to fetch status')
  }
  const doc = await res.json()
  return {
    id: doc.id,
    name: doc.name,
    version: doc.version,
    updatedAt: doc.updated_at,
    status: doc.status,
    knowledgeBase: doc.knowledge_base,
    pageCount: doc.page_count,
    sizeBytes: doc.size_bytes,
  }
}

export async function bulkUpdateDocuments(docIds: string[], knowledgeBase: string): Promise<void> {
  const res = await apiFetch('/api/documents/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ doc_ids: docIds, knowledge_base: knowledgeBase }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Bulk update failed')
  }
}

export async function fetchCategories(): Promise<any[]> {
  const res = await apiFetch('/api/admin/categories')
  if (!res.ok) return []
  return res.json()
}
