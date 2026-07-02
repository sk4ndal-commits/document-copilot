import { useEffect, useRef, useState } from 'react'
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  fetchIngestionStatus,
  summarizeDocument,
  compareDocuments,
  Document,
  DocumentStatus,
} from '../services/api/index'
import styles from './DocumentsPage.module.css'

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
  return (
    <span className={styles.statusBadge} data-status={status}>
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
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Document Center</h2>
        <div className={styles.topActions}>
          {selectedForCompare.length === 2 && (
            <button className={styles.compareBtn} onClick={handleCompare} disabled={comparing}>
              {comparing ? 'Comparing...' : 'Compare Selected'}
            </button>
          )}
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
            + Upload Document
          </button>
        </div>
      </div>

      <input
        placeholder="Search documents or knowledge base…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.searchInput}
      />

      {showUpload && (
        <div className={styles.uploadModal}>
          <div className={styles.uploadCard}>
            <div className={styles.uploadHeader}>
              <h3 className={styles.uploadTitle}>Upload Document</h3>
              <button className={styles.closeBtn} onClick={() => { setShowUpload(false); setSelectedFile(null) }}>✕</button>
            </div>

            <label className={styles.fileLabel}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx"
                className={styles.fileInput}
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile
                ? <span className={styles.fileName}>📄 {selectedFile.name}</span>
                : <span className={styles.filePlaceholder}>Click to select a file (.pdf, .docx, .xlsx, .pptx)</span>
              }
            </label>

            <div className={styles.kbRow}>
              <label className={styles.kbLabel}>Knowledge Base</label>
              <select
                className={styles.kbSelect}
                value={selectedKB}
                onChange={e => setSelectedKB(e.target.value)}
              >
                {KNOWLEDGE_BASES.map(kb => (
                  <option key={kb} value={kb}>{kb}</option>
                ))}
              </select>
            </div>

            <div className={styles.uploadActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowUpload(false); setSelectedFile(null) }}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
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
        <div className={styles.uploadModal}>
          <div className={styles.uploadCard}>
            <div className={styles.uploadHeader}>
              <h3 className={styles.uploadTitle}>{summary ? 'Document Summary' : 'Document Comparison'}</h3>
              <button className={styles.closeBtn} onClick={() => { setSummary(null); setComparison(null) }}>✕</button>
            </div>
            <div className={styles.aiContent}>
              <pre className={styles.preWrap}>{summary || comparison}</pre>
            </div>
            <div className={styles.uploadActions}>
              <button className={styles.confirmBtn} onClick={() => { setSummary(null); setComparison(null) }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.docList}>
        {filtered.map(doc => (
          <div key={doc.id} className={`${styles.docRow} ${selectedForCompare.includes(doc.id) ? styles.selectedRow : ''}`}>
            <div className={styles.docInfo}>
              <span className={styles.docName}>{doc.name}</span>
              <span className={styles.docMeta}>
                {doc.knowledgeBase} · {doc.version} · {doc.updatedAt}
                {doc.sizeBytes != null && ` · ${formatBytes(doc.sizeBytes)}`}
                {doc.pageCount != null && ` · ${doc.pageCount} pages`}
              </span>
            </div>
            <div className={styles.docRight}>
              <StatusBadge status={doc.status} />
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  disabled={doc.status !== 'ready' || summarizing === doc.id}
                  onClick={() => handleSummarize(doc.id)}
                >
                  {summarizing === doc.id ? '...' : 'Summarize'}
                </button>
                <button
                  className={styles.actionBtn}
                  disabled={doc.status !== 'ready'}
                  onClick={() => toggleCompareSelect(doc.id)}
                >
                  {selectedForCompare.includes(doc.id) ? 'Deselect' : 'Compare'}
                </button>
                <button className={styles.actionBtnDanger} onClick={() => handleDelete(doc.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
