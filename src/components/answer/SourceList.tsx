import { Source } from '../../services/api/index'
import styles from './SourceList.module.css'

interface SourceListProps {
  sources: Source[]
  onSelect: (source: Source) => void
}

export default function SourceList({ sources, onSelect }: SourceListProps) {
  return (
    <div className={styles.container}>
      <p className={styles.heading}>Sources Used</p>
      {sources.map(source => (
        <div key={source.id} className={styles.item} onClick={() => onSelect(source)}>
          <span className={styles.checkmark}>✓</span>
          <span className={styles.name}>{source.name}</span>
          <span className={styles.badge} data-level={source.confidence.toLowerCase()}>
            {source.confidence}
          </span>
          <span className={styles.score}>{source.score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
