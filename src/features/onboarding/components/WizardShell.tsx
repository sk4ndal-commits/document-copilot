import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOnboardingSession } from '../hooks/useOnboardingSession'
import DocumentSlot from './DocumentSlot'
import ComplianceHealthDashboard from './ComplianceHealthDashboard'
import { createSession, fetchSessions, SessionSummary } from '../../../services/api/onboarding'

export default function WizardShell() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()
  const { slots, uploadAndValidate, resetSlot, overallStatus, loading } = useOnboardingSession(sessionId)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      fetchSessions().then(setSessions)
    }
  }, [sessionId])

  const handleNewSession = async () => {
    const clientName = prompt('Client company name (e.g. Mustermann GmbH):') ?? ''
    if (clientName === null) return
    setCreating(true)
    try {
      const { id } = await createSession(clientName)
      navigate(`/onboarding/${id}`)
    } finally {
      setCreating(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Legal Onboarding Wizard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Start a new onboarding session for a client or resume an existing one.
          </p>
        </div>
        <button
          onClick={handleNewSession}
          disabled={creating}
          className="mb-8 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
        >
          {creating ? 'Creating…' : '+ New Onboarding Session'}
        </button>
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Existing Sessions</h2>
            <div className="space-y-2">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/onboarding/${s.id}`)}
                  className="w-full text-left bg-white border border-border rounded-xl px-5 py-4 shadow-sm hover:border-brand transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{s.client_name || 'Unnamed Client'}</span>
                    <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.slot_summary.ready}/{s.slot_summary.total} documents ready
                    {s.slot_summary.errors > 0 && (
                      <span className="ml-2 text-red-500">{s.slot_summary.errors} error{s.slot_summary.errors > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500">Loading session…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button onClick={() => navigate('/onboarding')} className="text-xs text-brand hover:underline mb-2 block">
          ← All Sessions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Legal Onboarding Wizard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload the required legal documents below. Each document is automatically validated by AI.
          Correct any issues and re-upload until all required documents are accepted.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Required Documents</h2>
          {slots.filter(s => s.required).map(slot => (
            <DocumentSlot
              key={slot.slot_id}
              slot={slot}
              onUpload={uploadAndValidate}
              onReset={resetSlot}
            />
          ))}

          {slots.some(s => !s.required) && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2">Optional Documents</h2>
              {slots.filter(s => !s.required).map(slot => (
                <DocumentSlot
                  key={slot.slot_id}
                  slot={slot}
                  onUpload={uploadAndValidate}
                  onReset={resetSlot}
                />
              ))}
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ComplianceHealthDashboard slots={slots} overallStatus={overallStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}
