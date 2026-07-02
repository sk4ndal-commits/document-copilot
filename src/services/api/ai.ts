import { apiFetch } from './client'

export interface SummaryResponse {
  summary: string
}

export interface ComparisonResponse {
  comparison: string
}

export async function summarizeDocument(docId: string): Promise<string> {
  const res = await apiFetch(`/api/ai/summarize/${docId}`, {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error('Failed to summarize document')
  }
  const data: SummaryResponse = await res.json()
  return data.summary
}

export async function compareDocuments(docIdA: string, docIdB: string): Promise<string> {
  const res = await apiFetch('/api/ai/compare', {
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
