import { useEffect, useRef, useState } from 'react'
import { Document, DocumentStatus, compareDocuments, deleteDocument, fetchDocuments, fetchIngestionStatus, summarizeDocument, uploadDocument } from '../services/api/index'

const KNOWLEDGE_BASES = [
  'Quality Management',
  'Service Manuals',
  'HR Policies',
  'Sales Documentation',
  'Contracts',
  'ISO Documents',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const badgeClasses = {
    ready: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm whitespace-nowrap ${badgeClasses[status]}`}>
      {status === 'ready' && '✓ Ready'}
      {status === 'processing' && '⟳ Processing…'}
      {status === 'failed' && '✗ Failed'}
    </span>
  )
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedKB, setSelectedKB] = useState(KNOWLEDGE_BASES[0])
  const [uploading, setUploading] = useState(false)
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [comparison, setComparison] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchDocuments().then(setDocs)
  }, [])

  // Poll processing documents every 3s
  useEffect(() => {
    const processing = docs.filter(d => d.status === 'processing')
    if (processing.length === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    pollingRef.current = setInterval(async () => {
      const updates = await Promise.all(processing.map(d => fetchIngestionStatus(d.id)))
      setDocs(prev => prev.map(d => {
        const updated = updates.find(u => u.id === d.id)
        return updated ?? d
      }))
    }, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [docs])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const { id } = await uploadDocument(selectedFile, selectedKB)
      const newDoc: Document = {
        id,
        name: selectedFile.name,
        version: 'v1',
        updatedAt: new Date().toISOString().slice(0, 10),
        status: 'processing',
        knowledgeBase: selectedKB,
        sizeBytes: selectedFile.size,
      }
      setDocs(prev => [newDoc, ...prev])
      setShowUpload(false)
      setSelectedFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const handleSummarize = async (id: string) => {
    setSummarizing(id)
    try {
      const res = await summarizeDocument(id)
      setSummary(res)
    } catch (err) {
      console.error(err)
      alert('Failed to summarize document')
    } finally {
      setSummarizing(null)
    }
  }

  const handleCompare = async () => {
    if (selectedForCompare.length !== 2) return
    setComparing(true)
    try {
      const res = await compareDocuments(selectedForCompare[0], selectedForCompare[1])
      setComparison(res)
    } catch (err) {
      console.error(err)
      alert('Failed to compare documents')
    } finally {
      setComparing(false)
    }
  }

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-2)
    )
  }

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.knowledgeBase.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Document Center</h2>
        <div className="flex gap-3 items-center">
          {selectedForCompare.length === 2 && (
            <button
              className="bg-gray-900 text-white border-none rounded-md px-4 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
              onClick={handleCompare}
              disabled={comparing}
            >
              {comparing ? 'Comparing...' : 'Compare Selected'}
            </button>
          )}
          <button
            className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover"
            onClick={() => setShowUpload(true)}
          >
            + Upload Document
          </button>
        </div>
      </div>

      <input
        placeholder="Search documents or knowledge base…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 text-sm border-[1.5px] border-border rounded-lg bg-bg text-gray-900 mb-5 transition-all duration-150 focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
      />

      {showUpload && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[200]">
          <div className="bg-bg rounded-xl shadow-lg p-6 w-[440px] max-w-[calc(100vw-2rem)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button
                className="bg-transparent border-none text-lg text-gray-500 p-1 rounded-sm transition-colors duration-150 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => { setShowUpload(false); setSelectedFile(null) }}
              >
                ✕
              </button>
            </div>

            <label className="block border-2 border-dashed border-border rounded-lg py-6 px-4 text-center cursor-pointer mb-4 transition-colors duration-150 hover:border-brand hover:bg-brand-light">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile
                ? <span className="text-sm text-gray-900 font-medium">📄 {selectedFile.name}</span>
                : <span className="text-sm text-gray-500">Click to select a file (.pdf, .docx, .xlsx, .pptx)</span>
              }
            </label>

            <div className="flex items-center gap-3 mb-5">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Knowledge Base</label>
              <select
                className="flex-1 p-2 border-[1.5px] border-border rounded-md text-sm bg-bg text-gray-900 focus:outline-none focus:border-brand"
                value={selectedKB}
                onChange={e => setSelectedKB(e.target.value)}
              >
                {KNOWLEDGE_BASES.map(kb => (
                  <option key={kb} value={kb}>{kb}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-transparent border border-border rounded-md text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100"
                onClick={() => { setShowUpload(false); setSelectedFile(null) }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(summary || comparison) && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[200]">
          <div className="bg-bg rounded-xl shadow-lg p-6 w-[440px] max-w-[calc(100vw-2rem)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {summary ? 'Document Summary' : 'Document Comparison'}
              </h3>
              <button
                className="bg-transparent border-none text-lg text-gray-500 p-1 rounded-sm transition-colors duration-150 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => { setSummary(null); setComparison(null) }}
              >
                ✕
              </button>
            </div>
            <div className="my-4 max-h-[400px] overflow-y-auto p-3 bg-gray-50 rounded-md border border-border">
              <pre className="whitespace-pre-wrap break-words font-inherit text-sm leading-relaxed text-gray-800 m-0">
                {summary || comparison}
              </pre>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover"
                onClick={() => { setSummary(null); setComparison(null) }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {filtered.map(doc => (
          <div
            key={doc.id}
            className={`flex justify-between items-center py-4 border-b border-gray-100 gap-4 ${
              selectedForCompare.includes(doc.id) ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">{doc.name}</span>
              <span className="text-[10px] text-gray-500">
                {doc.knowledgeBase} · {doc.version} · {doc.updatedAt}
                {doc.sizeBytes != null && ` · ${formatBytes(doc.sizeBytes)}`}
                {doc.pageCount != null && ` · ${doc.pageCount} pages`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={doc.status} />
              <div className="flex gap-2">
                <button
                  className="bg-transparent border border-border rounded-sm px-3 py-0.5 text-[10px] text-gray-700 transition-all duration-150 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={doc.status !== 'ready' || summarizing === doc.id}
                  onClick={() => handleSummarize(doc.id)}
                >
                  {summarizing === doc.id ? '...' : 'Summarize'}
                </button>
                <button
                  className="bg-transparent border border-border rounded-sm px-3 py-0.5 text-[10px] text-gray-700 transition-all duration-150 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={doc.status !== 'ready'}
                  onClick={() => toggleCompareSelect(doc.id)}
                >
                  {selectedForCompare.includes(doc.id) ? 'Deselect' : 'Compare'}
                </button>
                <button
                  className="bg-transparent border border-border rounded-sm px-3 py-0.5 text-[10px] text-danger transition-all duration-150 hover:bg-red-50 hover:border-danger"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
