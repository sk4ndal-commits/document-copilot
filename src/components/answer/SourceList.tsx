import { Source } from '../../services/api'
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
        </div>
      ))}
    </div>
  )
}
