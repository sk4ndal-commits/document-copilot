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
    sources: data.sources,
    followUpQuestions: data.follow_up_questions,
    modelUsed: data.model_used,
    latencyMs: data.latency_ms,
  }
}
