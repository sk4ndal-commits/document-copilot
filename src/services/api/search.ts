import { apiFetch } from './client'
import { AnswerResult } from './types'

export async function fetchAnswer(query: string, knowledgeBase: string | null = null): Promise<AnswerResult> {
  const res = await apiFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      knowledge_base: knowledgeBase,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to fetch answer')
  }

  const data = await res.json()

  return {
    answer: data.answer,
    blocked: data.blocked,
    sources: data.sources, // Assuming backend Source model matches frontend or is compatible
    modelUsed: data.model_used,
    latencyMs: data.latency_ms,
  }
}
