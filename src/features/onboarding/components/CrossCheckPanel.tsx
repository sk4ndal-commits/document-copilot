import { useState } from 'react'
import { runCrossCheck, ConsistencyReport } from '../../../services/api/onboarding'

interface Props {
  sessionId: string
  allSlotsReady: boolean
}

export default function CrossCheckPanel({ sessionId, allSlotsReady }: Props) {
  const [report, setReport] = useState<ConsistencyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await runCrossCheck(sessionId)
      setReport(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!allSlotsReady) return null

  return (
    <div className="mt-8 border border-border rounded-xl bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cross-Document Consistency Check</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compares VAT IDs, HRB numbers, company names, and signatories across all validated documents.
          </p>
        </div>
        <button
          onClick={handleCheck}
          disabled={loading}
          className="px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand/90 disabled:opacity-50 shrink-0"
        >
          {loading ? 'Checking…' : 'Run Check'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {report && (
        <div className={`rounded-lg px-4 py-3 text-xs ${report.consistent ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {report.consistent ? (
            <p className="text-green-700 font-medium">✅ All documents are consistent. No discrepancies found.</p>
          ) : (
            <>
              <p className="text-yellow-800 font-semibold mb-2">⚠️ Discrepancies detected:</p>
              <ul className="space-y-1">
                {report.discrepancies.map((d, i) => (
                  <li key={i} className="text-yellow-800">
                    <span className="font-medium capitalize">{d.field.replace('_', ' ')}:</span> {d.details}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
