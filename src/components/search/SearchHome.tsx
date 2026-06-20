import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import SuggestedQuestions from './SuggestedQuestions'
import styles from './SearchHome.module.css'

export default function SearchHome() {
  const navigate = useNavigate()

  const handleSearch = (query: string) => {
    navigate(`/answer?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Company Knowledge Copilot</h1>
      <p className={styles.subtitle}>Ask anything about company knowledge...</p>
      <SearchBar onSearch={handleSearch} />
      <SuggestedQuestions onSelect={handleSearch} />
    </div>
  )
}
