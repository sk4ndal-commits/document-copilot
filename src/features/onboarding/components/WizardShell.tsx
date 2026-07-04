import { useOnboardingSession } from '../hooks/useOnboardingSession'
import DocumentSlot from './DocumentSlot'
import ComplianceHealthDashboard from './ComplianceHealthDashboard'

export default function WizardShell() {
  const { slots, uploadAndValidate, resetSlot, overallStatus } = useOnboardingSession()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
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
