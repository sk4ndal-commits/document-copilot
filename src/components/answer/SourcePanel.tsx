import { Source } from '../../services/api/index'
import styles from './SourcePanel.module.css'

interface SourcePanelProps {
  source: Source
  onClose: () => void
}

export default function SourcePanel({ source, onClose }: SourcePanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{source.name}</span>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.meta}>
        <span className={styles.confidenceBadge} data-level={source.confidence.toLowerCase()}>
          {source.confidence}
        </span>
        <span className={styles.score}>score: {source.score.toFixed(2)}</span>
      </div>

      <div className={styles.chunks}>
        {source.chunks.map((chunk, i) => (
          <div key={chunk.chunkId} className={styles.chunk}>
            <p className={styles.chunkLabel}>
              Chunk {i + 1}{chunk.pageNumber != null ? ` — Page ${chunk.pageNumber}` : ''}
              <span className={styles.chunkScore}>{chunk.score.toFixed(2)}</span>
            </p>
            <p className={styles.chunkText}>{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
