import styles from './ChatHistory.module.css'

const history: Record<string, string[]> = {
  Today: ['Warranty Claims', 'Service Procedure X', 'ISO Audit Questions'],
  Yesterday: ['Spare Parts Process'],
}

export default function ChatHistory() {
  return (
    <aside className={styles.history}>
      {Object.entries(history).map(([day, items]) => (
        <div key={day} className={styles.group}>
          <p className={styles.dayLabel}>{day}</p>
          {items.map(item => (
            <p key={item} className={styles.item}>• {item}</p>
          ))}
        </div>
      ))}
    </aside>
  )
}
