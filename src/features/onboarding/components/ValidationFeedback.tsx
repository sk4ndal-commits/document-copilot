import type { ValidationResult } from '../types/onboarding'

interface Props {
  result: ValidationResult
}

export default function ValidationFeedback({ result }: Props) {
  const { is_valid, errors, extracted_info } = result

  return (
    <div className="mt-3 space-y-3">
      {!is_valid && errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-xs font-semibold text-red-700 mb-1">Issues found:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {(extracted_info.company_name || extracted_info.vat_id || extracted_info.hrb_number ||
        extracted_info.document_date || (extracted_info.signatories && extracted_info.signatories.length > 0)) && (
        <div className="rounded-md bg-gray-50 border border-border p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Extracted Information:</p>
          <dl className="space-y-1">
            {extracted_info.company_name && (
              <div className="flex gap-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">Company:</dt>
                <dd className="text-xs text-gray-800 font-medium">{extracted_info.company_name}</dd>
              </div>
            )}
            {extracted_info.vat_id && (
              <div className="flex gap-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">USt-IdNr:</dt>
                <dd className="text-xs text-gray-800 font-medium">{extracted_info.vat_id}</dd>
              </div>
            )}
            {extracted_info.hrb_number && (
              <div className="flex gap-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">HRB-Nummer:</dt>
                <dd className="text-xs text-gray-800 font-medium">{extracted_info.hrb_number}</dd>
              </div>
            )}
            {extracted_info.document_date && (
              <div className="flex gap-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">Document Date:</dt>
                <dd className="text-xs text-gray-800 font-medium">{extracted_info.document_date}</dd>
              </div>
            )}
            {extracted_info.signatories && extracted_info.signatories.length > 0 && (
              <div className="flex gap-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">Signatories:</dt>
                <dd className="text-xs text-gray-800 font-medium">{extracted_info.signatories.join(', ')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
