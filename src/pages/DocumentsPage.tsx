import { useEffect, useState } from 'react'
import { fetchDocuments, Document } from '../services/api'
import styles from './DocumentsPage.module.css'

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { fetchDocuments().then(setDocs) }, [])

  const filtered = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Document Center</h2>
      <input
        placeholder="Search documents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.searchInput}
      />
      {filtered.map(doc => (
        <div key={doc.id} className={styles.docRow}>
          <span className={styles.docName}>
            <span className={styles.checkmark}>✓</span>
            {doc.name}
          </span>
          <div className={styles.actions}>
            <button className={styles.actionBtn}>Replace</button>
            <button className={styles.actionBtn}>History</button>
            <button className={styles.actionBtnDanger}>Delete</button>
          </div>
        </div>
      ))}
      <button className={styles.uploadBtn}>+ Upload Document</button>
    </div>
  )
}
