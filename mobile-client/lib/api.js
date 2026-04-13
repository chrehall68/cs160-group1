import AsyncStorage from "@react-native-async-storage/async-storage";

export async function apiRequest(url, options = {}) {
  const token = await AsyncStorage.getItem('auth.jwt') ?? ''
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
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