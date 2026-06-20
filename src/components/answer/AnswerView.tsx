import { useState } from 'react'
import { AnswerResult, Source } from '../../services/api'
import SourceList from './SourceList'
import SourcePanel from './SourcePanel'
import styles from './AnswerView.module.css'

interface AnswerViewProps {
  result: AnswerResult
}

export default function AnswerView({ result }: AnswerViewProps) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [showSources, setShowSources] = useState(false)

  if (result.blocked) {
    return (
      <div className={styles.blockedCard}>
        <p className={styles.blockedTitle}>No accessible documents found.</p>
        <p className={styles.blockedSubtext}>
          You do not have permission to access documents related to this query.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.card}>
        <p className={styles.cardTitle}>Answer</p>
        <p className={styles.answerText}>{result.answer}</p>
      </div>

      <button className={styles.showSourcesBtn} onClick={() => setShowSources(s => !s)}>
        {showSources ? 'Hide Sources' : 'Show Sources'}
      </button>

      {showSources && (
        <div className={styles.sourcesPanel}>
          <p className={styles.sourcesPanelMeta}>
            Source Confidence: <strong>High</strong>
          </p>
          <p className={styles.sourcesPanelLabel}>Used Documents:</p>
          {result.sources.map(s => (
            <div key={s.id} className={styles.sourcesPanelItem}>✓ {s.name}</div>
          ))}
        </div>
      )}

      <SourceList sources={result.sources} onSelect={setSelectedSource} />

      {selectedSource && (
        <SourcePanel source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}
    </div>
  )
}
