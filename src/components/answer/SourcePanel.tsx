import { Source } from '../../services/api'
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
      <p className={styles.excerpt}>{source.excerpt}</p>
      <p className={styles.confidence}>
        Confidence: <strong>{source.confidence}</strong>
      </p>
    </div>
  )
}
