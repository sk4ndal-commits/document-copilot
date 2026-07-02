import { useState } from 'react'
import { fetchAnswer, AnswerResult } from '../services/api/index'

export function useSearch() {
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async (query: string) => {
    setLoading(true)
    const data = await fetchAnswer(query)
    setResult(data)
    setLoading(false)
  }

  return { result, loading, search }
}
