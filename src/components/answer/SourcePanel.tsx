import { Source } from '../../services/api/index'

interface SourcePanelProps {
  source: Source
  onClose: () => void
}

export default function SourcePanel({ source, onClose }: SourcePanelProps) {
  const badgeClasses = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  }

  return (
    <div className="fixed right-6 top-20 w-[380px] max-h-[calc(100vh-7rem)] overflow-y-auto bg-bg border border-border rounded-xl shadow-lg p-5 z-[100]">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-gray-900 leading-tight pr-3">
          {source.name}
        </span>
        <button
          className="bg-transparent border-none text-lg text-gray-500 leading-none p-1 rounded-sm shrink-0 transition-colors duration-150 hover:text-gray-900 hover:bg-gray-100"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
            badgeClasses[source.confidence.toLowerCase() as keyof typeof badgeClasses] || ''
          }`}
        >
          {source.confidence}
        </span>
        <span className="text-[10px] text-gray-500">score: {source.score.toFixed(2)}</span>
      </div>

      <div className="flex flex-col gap-3">
        {source.chunks.map((chunk, i) => (
          <div key={chunk.chunkId} className="bg-surface border border-border rounded-md p-3">
            <p className="flex justify-between text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              <span>
                Chunk {i + 1}
                {chunk.pageNumber != null ? ` — Page ${chunk.pageNumber}` : ''}
                {chunk.startOffset != null && ` — Offsets: [${chunk.startOffset}, ${chunk.endOffset}]`}
              </span>
              <span className="font-normal text-gray-400">{chunk.score.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-700 italic leading-relaxed">{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
