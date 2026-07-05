import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublicSession, publicUploadSlot } from '../services/api/onboarding'
import type { SessionDetail, SlotState } from '../services/api/onboarding'

export default function PublicOnboardingPage() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchPublicSession(token)
      .then(setSession)
      .catch(() => setError('This link is invalid or has expired.'))
  }, [token])

  async function handleUpload(slot: SlotState, file: File) {
    if (!token) return
    setUploading(slot.slot_id)
    try {
      const updated = await publicUploadSlot(token, slot.slot_id, file)
      setSession(prev =>
        prev
          ? {
              ...prev,
              slots: prev.slots.map(s =>
                s.slot_id === updated.slot_id ? { ...s, ...updated } : s,
              ),
            }
          : prev,
      )
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(null)
    }
  }

  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>
  if (!session) return <div style={{ padding: 40 }}>Loading…</div>

  const statusColor: Record<string, string> = {
    pending: '#888',
    uploading: '#f0a500',
    validating: '#f0a500',
    ready: '#22c55e',
    error: '#ef4444',
  }

  return (
    <div style={{ maxWidth: 680, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Document Submission</h1>
      <p style={{ color: '#555', marginBottom: 32 }}>
        Please upload the required documents for <strong>{session.client_name}</strong>.
        Each document is validated instantly.
      </p>

      {session.slots.map(slot => (
        <div
          key={slot.slot_id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{slot.label}</strong>
              {slot.required && (
                <span style={{ color: '#ef4444', marginLeft: 6, fontSize: 12 }}>required</span>
              )}
            </div>
            <span
              style={{
                background: statusColor[slot.status] ?? '#888',
                color: '#fff',
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              {slot.status}
            </span>
          </div>

          {slot.filename && (
            <p style={{ fontSize: 13, color: '#555', margin: '8px 0 0' }}>📄 {slot.filename}</p>
          )}

          {slot.result && !slot.result.is_valid && slot.result.errors.length > 0 && (
            <ul style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
              {slot.result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}

          {slot.result?.is_valid && (
            <p style={{ color: '#22c55e', fontSize: 13, marginTop: 8 }}>✅ Document accepted</p>
          )}

          <label
            style={{
              display: 'inline-block',
              marginTop: 12,
              cursor: uploading === slot.slot_id ? 'not-allowed' : 'pointer',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 13,
            }}
          >
            {uploading === slot.slot_id ? 'Uploading…' : slot.status === 'ready' ? 'Replace' : 'Upload'}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              disabled={uploading === slot.slot_id}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(slot, file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      ))}
    </div>
  )
}
