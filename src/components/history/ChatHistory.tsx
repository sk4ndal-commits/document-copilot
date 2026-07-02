import { useState, useEffect } from 'react'
import { fetchConversations, Conversation } from '../../services/api'
import styles from './ChatHistory.module.css'

export default function ChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <aside className={styles.history}>Loading history...</aside>

  return (
    <aside className={styles.history}>
      <div className={styles.group}>
        <p className={styles.dayLabel}>Recent Conversations</p>
        {conversations.length === 0 ? (
          <p className={styles.item}>No history yet</p>
        ) : (
          conversations.map(conv => (
            <p key={conv.id} className={styles.item}>• {conv.title}</p>
          ))
        )}
      </div>
    </aside>
  )
}
