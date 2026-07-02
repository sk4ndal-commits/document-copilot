const suggestions = [
  'Warranty process France',
  'Vacation policy',
  'Machine X maintenance',
  'ISO audit requirements',
]

interface SuggestedQuestionsProps {
  onSelect: (query: string) => void
}

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="mt-8 text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Suggested Questions
      </p>
      <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
        {suggestions.map((q) => (
          <li key={q}>
            <button
              className="px-3 py-1.5 bg-gray-50 border border-border rounded-full text-sm text-gray-700 transition-all duration-150 hover:bg-white hover:border-brand hover:text-brand cursor-pointer"
              onClick={() => onSelect(q)}
            >
              • {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
