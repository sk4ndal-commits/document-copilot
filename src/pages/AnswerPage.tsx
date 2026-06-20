import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSearch } from '../hooks/useSearch'
import AnswerView from '../components/answer/AnswerView'
import SearchBar from '../components/search/SearchBar'
import styles from './AnswerPage.module.css'

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
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <SearchBar onSearch={handleNewSearch} initialValue={query} />
      </div>
      {loading && <p className={styles.loading}>Searching...</p>}
      {result && <AnswerView result={result} />}
    </div>
  )
}
