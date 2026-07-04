import type { OnboardingSlot } from '../types/onboarding'

interface Props {
  slots: OnboardingSlot[]
  overallStatus: 'pending' | 'in_progress' | 'has_errors' | 'complete'
}

const statusIcon = {
  pending: '○',
  uploading: '↑',
  validating: '⟳',
  ready: '✓',
  error: '✗',
}

const statusColor = {
  pending: 'text-gray-400',
  uploading: 'text-blue-500',
  validating: 'text-yellow-600',
  ready: 'text-green-600',
  error: 'text-red-600',
}

export default function ComplianceHealthDashboard({ slots, overallStatus }: Props) {
  const required = slots.filter(s => s.required)
  const readyCount = required.filter(s => s.status === 'ready').length
  const total = required.length
  const pct = total > 0 ? Math.round((readyCount / total) * 100) : 0

  const overallConfig = {
    pending: { label: 'Not started', color: 'text-gray-500', bar: 'bg-gray-300' },
    in_progress: { label: 'In progress', color: 'text-blue-600', bar: 'bg-blue-500' },
    has_errors: { label: 'Action required', color: 'text-red-600', bar: 'bg-red-500' },
    complete: { label: 'Ready to submit', color: 'text-green-600', bar: 'bg-green-500' },
  }[overallStatus]

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Compliance Health</h2>
        <span className={`text-sm font-semibold ${overallConfig.color}`}>{overallConfig.label}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{readyCount} of {total} required documents valid</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${overallConfig.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {slots.map(slot => (
          <li key={slot.slot_id} className="flex items-center gap-2 text-xs">
            <span className={`font-bold w-4 text-center ${statusColor[slot.status]}`}>
              {statusIcon[slot.status]}
            </span>
            <span className="text-gray-700 flex-1">{slot.label}</span>
            {!slot.required && (
              <span className="text-[10px] text-gray-400 italic">optional</span>
            )}
          </li>
        ))}
      </ul>

      {overallStatus === 'complete' && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm font-semibold text-green-700">All required documents are valid.</p>
          <p className="text-xs text-green-600 mt-0.5">You can now submit your onboarding package.</p>
        </div>
      )}
    </div>
  )
}
