import { apiFetch } from './client'

export interface SummaryResponse {
  summary: string
}

export interface ComparisonResponse {
  comparison: string
}

export async function summarizeDocument(docId: string): Promise<string> {
  const res = await apiFetch(`/api/ai/legal-summary/${docId}`, {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error('Failed to summarize document')
  }
  const data: SummaryResponse = await res.json()
  return data.summary
}

export async function compareDocuments(docIdA: string, docIdB: string): Promise<string> {
  const res = await apiFetch('/api/ai/golden-standard-check', {
    method: 'POST',
    body: JSON.stringify({
      doc_id_a: docIdA,
      doc_id_b: docIdB,
    }),
  })
  if (!res.ok) {
    throw new Error('Failed to compare documents')
  }
  const data: ComparisonResponse = await res.json()
  return data.comparison
}

export async function fetchSuggestedQuestions(): Promise<string[]> {
  const res = await apiFetch('/api/ai/suggested-legal-queries')
  if (!res.ok) return []
  return res.json()
}
