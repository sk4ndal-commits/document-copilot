import { useState, useEffect } from 'react'
import { fetchConversations, Conversation } from '../../services/api'

export default function ChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <aside className="w-[var(--history-width)] border-l border-border px-4 py-6 text-sm overflow-y-auto shrink-0">
        Loading history...
      </aside>
    )

  return (
    <aside className="w-[var(--history-width)] border-l border-border px-4 py-6 text-sm overflow-y-auto shrink-0">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Recent Conversations
        </p>
        {conversations.length === 0 ? (
          <p className="text-gray-700 m-0 py-1 px-2">No history yet</p>
        ) : (
          conversations.map((conv) => (
            <p
              key={conv.id}
              className="text-gray-700 m-0 mb-1 py-1 px-2 rounded-sm cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            >
              • {conv.title}
            </p>
          ))
        )}
      </div>
    </aside>
  )
}
