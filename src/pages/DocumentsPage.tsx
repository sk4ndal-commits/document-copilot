import { useEffect, useRef, useState } from 'react'
import { fetchDocuments, uploadDocument, deleteDocument, fetchIngestionStatus, Document, DocumentStatus } from '../services/api'
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

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.knowledgeBase.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Document Center</h2>
        <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
          + Upload Document
        </button>
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

      <div className={styles.docList}>
        {filtered.map(doc => (
          <div key={doc.id} className={styles.docRow}>
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
                <button className={styles.actionBtn} disabled={doc.status !== 'ready'}>Replace</button>
                <button className={styles.actionBtn} disabled={doc.status !== 'ready'}>History</button>
                <button className={styles.actionBtnDanger} onClick={() => handleDelete(doc.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
