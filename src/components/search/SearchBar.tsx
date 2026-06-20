import { useState } from 'react'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) onSearch(value.trim())
  }

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        className={styles.input}
      />
    </div>
  )
}
