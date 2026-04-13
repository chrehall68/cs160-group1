import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from './api'

const BASE_URL = 'http://localhost:8000'

export async function login(username, password) {
  const data = await apiRequest(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (data.access_token) {
    await AsyncStorage.setItem('auth.jwt', data.access_token)
  }
  return data
}

export async function logout() {
  await AsyncStorage.removeItem('auth.jwt')
}

export async function signup(body) {
  return apiRequest('http://localhost:8000/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}


async function authRequest(path, options = {}) {
  const token = await AsyncStorage.getItem('auth.jwt') ?? ''
  return apiRequest(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

export async function fetchAccounts() {
  const data = await authRequest('/accounts')
  return Array.isArray(data) ? data : data.accounts ?? []
}

export async function fetchTransactions(accountId) {
  return authRequest(`/api/transactions/${accountId}?page=1&limit=5`)
}