import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnswerResult, Source, submitFeedback } from '../../services/api'
import SourceList from './SourceList'
import SourcePanel from './SourcePanel'

interface AnswerViewProps {
  result: AnswerResult
}

export default function AnswerView({ result }: AnswerViewProps) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [showSources, setShowSources] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<'liked' | 'disliked' | null>(null)
  const navigate = useNavigate()

  const handleFollowUp = (q: string) => {
    navigate(`/answer?q=${encodeURIComponent(q)}`)
  }

  const handleFeedback = async (val: number) => {
    if (!result.id) return
    try {
      await submitFeedback(result.id, val)
      setFeedbackStatus(val === 1 ? 'liked' : 'disliked')
    } catch (err) {
      console.error('Feedback failed', err)
    }
  }

  if (result.blocked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-danger font-medium mb-2">No accessible documents found.</p>
        <p className="text-gray-500 text-sm">
          You do not have permission to access documents related to this query.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-surface border border-border rounded-xl p-6 mb-4 relative group">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Answer</p>
        <p className="whitespace-pre-line text-gray-900 leading-relaxed text-base">{result.answer}</p>
        
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={() => handleFeedback(1)}
            className={`p-1.5 rounded-md border transition-all ${
              feedbackStatus === 'liked' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-border text-gray-400 hover:text-green-600'
            }`}
            title="Helpful"
          >
            👍
          </button>
          <button 
            onClick={() => handleFeedback(-1)}
            className={`p-1.5 rounded-md border transition-all ${
              feedbackStatus === 'disliked' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-border text-gray-400 hover:text-red-600'
            }`}
            title="Not helpful"
          >
            👎
          </button>
        </div>
      </div>

      {result.followUpQuestions && result.followUpQuestions.length > 0 && (
        <div className="mt-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Suggested Follow-ups:</p>
          <div className="flex flex-wrap gap-2">
            {result.followUpQuestions.map((q, idx) => (
              <button 
                key={idx} 
                className="px-3 py-1.5 bg-gray-50 border border-border rounded-full text-sm text-gray-700 transition-all duration-150 hover:bg-white hover:border-brand hover:text-brand cursor-pointer"
                onClick={() => handleFollowUp(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="mb-4 px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover"
        onClick={() => setShowSources(s => !s)}
      >
        {showSources ? 'Hide Sources' : 'Show Sources'}
      </button>

      {showSources && (
        <div className="mb-4 p-4 border border-border rounded-lg">
          <p className="text-sm text-gray-500 mb-2">
            Source Confidence: <strong>High</strong>
          </p>
          <p className="text-sm text-gray-700 mb-2 font-medium">Used Documents:</p>
          <div className="flex flex-col gap-1">
            {result.sources.map(s => (
              <div key={s.id} className="text-sm text-gray-700">✓ {s.name}</div>
            ))}
          </div>
        </div>
      )}

      <SourceList sources={result.sources} onSelect={setSelectedSource} />

      {selectedSource && (
        <SourcePanel source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}
    </div>
  )
}
