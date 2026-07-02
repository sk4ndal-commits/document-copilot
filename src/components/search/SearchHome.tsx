import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import SuggestedQuestions from './SuggestedQuestions'

export default function SearchHome() {
  const navigate = useNavigate()

  const handleSearch = (query: string) => {
    navigate(`/answer?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="max-w-[600px] mx-auto mt-[8vh] text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Company Knowledge Copilot</h1>
      <p className="text-gray-500 mb-8">Ask anything about company knowledge...</p>
      <SearchBar onSearch={handleSearch} />
      <SuggestedQuestions onSelect={handleSearch} />
    </div>
  )
}
