import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSearch } from '../hooks/useSearch'
import AnswerView from '../components/answer/AnswerView'
import SearchBar from '../components/search/SearchBar'

export default function AnswerPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { result, loading, search } = useSearch()
  const navigate = useNavigate()

  useEffect(() => {
    if (query) search(query)
  }, [query])

  const handleNewSearch = (q: string) => navigate(`/answer?q=${encodeURIComponent(q)}`)

  return (
    <div className="max-w-[var(--content-max)] mx-auto">
      <div className="mb-6">
        <SearchBar onSearch={handleNewSearch} initialValue={query} />
      </div>
      {loading && <p className="text-gray-500 text-sm">Searching...</p>}
      {result && <AnswerView result={result} />}
    </div>
  )
}
