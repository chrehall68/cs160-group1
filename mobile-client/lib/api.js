export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', 
  })

  let data = null
  try {
    data = await response.json()
  } catch {}

  if (!response.ok) {
    throw new Error(data?.detail || 'Request failed')
  }

  return data
}