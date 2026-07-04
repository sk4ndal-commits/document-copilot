import { apiFetch } from './client'
import type { ValidateOnboardingResponse } from './types'

export async function validateOnboardingDocument(
  file: File,
  docType: string
): Promise<ValidateOnboardingResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doc_type', docType)

  const res = await apiFetch('/api/documents/validate-onboarding', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Validation failed (${res.status})`)
  }

  return res.json()
}
