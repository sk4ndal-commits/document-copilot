import styles from './SuggestedQuestions.module.css'

const suggestions = [
  'Warranty process France',
  'Vacation policy',
  'Machine X maintenance',
  'ISO audit requirements',
]

interface SuggestedQuestionsProps {
  onSelect: (query: string) => void
}

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Suggested Questions</p>
      <ul className={styles.list}>
        {suggestions.map(q => (
          <li key={q} className={styles.item}>
            <button className={styles.button} onClick={() => onSelect(q)}>
              • {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
