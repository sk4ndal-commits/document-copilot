import { useRef } from 'react'
import type { OnboardingSlot } from '../types/onboarding'
import ValidationFeedback from './ValidationFeedback'

interface Props {
  slot: OnboardingSlot
  onUpload: (slot_id: string, file: File) => void
  onReset: (slot_id: string) => void
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
  uploading: { label: 'Uploading…', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  validating: { label: 'Checking document…', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  ready: { label: 'Valid ✓', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  error: { label: 'Issues found', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function DocumentSlot({ slot, onUpload, onReset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cfg = statusConfig[slot.status]
  const isProcessing = slot.status === 'uploading' || slot.status === 'validating'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(slot.slot_id, file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && !isProcessing) onUpload(slot.slot_id, file)
  }

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4 transition-all duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{slot.label}</h3>
            {slot.required && (
              <span className="text-[10px] font-medium text-red-500 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 shrink-0">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{slot.description}</p>
          {slot.filename && (
            <p className="text-xs text-gray-600 mt-1 truncate">📄 {slot.filename}</p>
          )}
        </div>
        <span className={`text-xs font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
      </div>

      {slot.result && <ValidationFeedback result={slot.result} />}

      <div className="mt-3 flex items-center gap-2">
        {slot.status === 'pending' || slot.status === 'error' ? (
          <div
            className="flex-1 border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-brand hover:bg-white transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <p className="text-xs text-gray-500">
              {slot.status === 'error' ? 'Upload corrected document' : 'Drop file here or click to upload'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOCX, XLSX accepted</p>
          </div>
        ) : isProcessing ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-2">
            <svg className="animate-spin h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs text-gray-600">{cfg.label}</span>
          </div>
        ) : slot.status === 'ready' ? (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs text-green-700 font-medium">Document accepted</span>
            <button
              onClick={() => onReset(slot.slot_id)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Replace
            </button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.pptx,.txt"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </div>
    </div>
  )
}
