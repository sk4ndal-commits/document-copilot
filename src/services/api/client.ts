// Auth wrapper — replace getToken() with your Keycloak/OIDC adapter
function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  // Only set application/json if not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
