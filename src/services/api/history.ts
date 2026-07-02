import { apiFetch } from './client'
import { Conversation, Message } from './types'

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await apiFetch('/api/history/')
  if (!res.ok) throw new Error('Failed to fetch conversations')
  const data = await res.json()
  return data.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.created_at,
    lastMessage: conv.last_message,
  }))
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const res = await apiFetch(`/api/history/${conversationId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function saveConversation(message: string, conversationId?: string): Promise<Conversation> {
  const res = await apiFetch('/api/history/', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
  })
  if (!res.ok) throw new Error('Failed to save message')
  const data = await res.json()
  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    lastMessage: data.last_message,
  }
}
