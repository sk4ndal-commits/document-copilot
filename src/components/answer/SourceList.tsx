import { Source } from '../../services/api/index'

interface SourceListProps {
  sources: Source[]
  onSelect: (source: Source) => void
}

export default function SourceList({ sources, onSelect }: SourceListProps) {
  const badgeClasses = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  }

  return (
    <div className="mt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-border">
        Sources Used
      </p>
      {sources.map((source) => (
        <div
          key={source.id}
          className="flex items-center gap-2 py-2 cursor-pointer text-sm text-brand border-b border-gray-100 transition-colors duration-150 hover:text-brand-hover"
          onClick={() => onSelect(source)}
        >
          <span className="text-green-600 shrink-0">✓</span>
          <span className="underline flex-1">{source.name}</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm shrink-0 ${
              badgeClasses[source.confidence.toLowerCase() as keyof typeof badgeClasses] || ''
            }`}
          >
            {source.confidence}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0">{source.score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
