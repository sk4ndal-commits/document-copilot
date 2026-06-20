export interface Source {
  id: number
  name: string
  excerpt: string
  confidence: 'High' | 'Medium' | 'Low'
}

export interface AnswerResult {
  answer: string
  sources: Source[]
  blocked?: boolean
}

export interface Document {
  id: number
  name: string
  version: string
  updatedAt: string
}

// All backend calls live here. Swap mock data for real fetch() calls.

export async function fetchAnswer(query: string, _knowledgeBase: string | null = null): Promise<AnswerResult> {
  // TODO: replace with real API call
  // return fetch('/api/search', { method: 'POST', body: JSON.stringify({ query, knowledgeBase }) }).then(r => r.json())

  if (query.toLowerCase().includes('salary') || query.toLowerCase().includes('salaries')) {
    return { answer: '', sources: [], blocked: true }
  }

  return {
    answer: `French warranty claims must be processed within 14 days.\n\nSteps:\n1. Verify invoice\n2. Create service ticket\n3. Notify regional team`,
    sources: [
      { id: 1, name: 'Warranty_Handbook_2025.pdf', excerpt: '"French warranty claims must be submitted with original invoice..."', confidence: 'High' },
      { id: 2, name: 'CRM_Process.docx', excerpt: '"Create a service ticket in CRM under category FR-WARRANTY..."', confidence: 'High' },
      { id: 3, name: 'Service_Guidelines.pdf', excerpt: '"Regional team must be notified within 48 hours..."', confidence: 'Medium' },
    ],
  }
}

export async function fetchDocuments(): Promise<Document[]> {
  return [
    { id: 1, name: 'Warranty_Handbook.pdf', version: 'v3', updatedAt: '2025-01-10' },
    { id: 2, name: 'ISO9001_Audit.pdf', version: 'v1', updatedAt: '2025-03-05' },
    { id: 3, name: 'Employee_Handbook.docx', version: 'v2', updatedAt: '2024-11-20' },
    { id: 4, name: 'Service_Manual_X.pdf', version: 'v5', updatedAt: '2025-06-01' },
  ]
}
