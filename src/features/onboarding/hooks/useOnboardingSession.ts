import { useState, useCallback } from 'react'
import type { OnboardingSlot, ValidationResult } from '../types/onboarding'
import { validateOnboardingDocument } from '../../../services/api/validation'

const INITIAL_SLOTS: OnboardingSlot[] = [
  {
    slot_id: 'handelsregister',
    doc_type: 'Handelsregisterauszug',
    label: 'Handelsregisterauszug',
    description: 'Current extract from the commercial register (not older than 90 days)',
    required: true,
    status: 'pending',
  },
  {
    slot_id: 'dpa',
    doc_type: 'DPA/DSGVO',
    label: 'Data Processing Agreement (DPA/DSGVO)',
    description: 'Signed data processing agreement compliant with GDPR',
    required: true,
    status: 'pending',
  },
  {
    slot_id: 'haftpflicht',
    doc_type: 'Haftpflichtversicherung',
    label: 'Haftpflichtversicherungsnachweis',
    description: 'Proof of liability insurance (current certificate)',
    required: true,
    status: 'pending',
  },
  {
    slot_id: 'steuer',
    doc_type: 'Steuerbescheinigung',
    label: 'Steuerbescheinigung / USt-IdNr',
    description: 'Tax clearance certificate or VAT ID confirmation',
    required: false,
    status: 'pending',
  },
]

export function useOnboardingSession() {
  const [slots, setSlots] = useState<OnboardingSlot[]>(INITIAL_SLOTS)

  const updateSlot = useCallback((slot_id: string, patch: Partial<OnboardingSlot>) => {
    setSlots(prev => prev.map(s => s.slot_id === slot_id ? { ...s, ...patch } : s))
  }, [])

  const uploadAndValidate = useCallback(async (slot_id: string, file: File) => {
    const slot = slots.find(s => s.slot_id === slot_id)
    if (!slot) return

    updateSlot(slot_id, { status: 'uploading', filename: file.name })

    try {
      updateSlot(slot_id, { status: 'validating' })
      const response = await validateOnboardingDocument(file, slot.doc_type)
      const result: ValidationResult = response.result
      updateSlot(slot_id, {
        status: result.is_valid ? 'ready' : 'error',
        result,
        filename: file.name,
      })
    } catch (err) {
      updateSlot(slot_id, {
        status: 'error',
        result: {
          is_valid: false,
          errors: [(err as Error).message || 'Unknown error during validation'],
          extracted_info: {},
        },
      })
    }
  }, [slots, updateSlot])

  const resetSlot = useCallback((slot_id: string) => {
    updateSlot(slot_id, { status: 'pending', result: undefined, filename: undefined })
  }, [updateSlot])

  const overallStatus = ((): 'pending' | 'complete' | 'has_errors' | 'in_progress' => {
    const required = slots.filter(s => s.required)
    if (required.every(s => s.status === 'ready')) return 'complete'
    if (required.some(s => s.status === 'error')) return 'has_errors'
    if (required.some(s => s.status === 'validating' || s.status === 'uploading')) return 'in_progress'
    return 'pending'
  })()

  return { slots, uploadAndValidate, resetSlot, overallStatus }
}
