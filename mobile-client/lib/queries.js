import { apiRequest } from './api'

const BASE_URL = 'http://localhost:8000'

export async function login(username, password) {
  return apiRequest('http://localhost:8000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username, 
      password: password,
    }),
  })
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


export async function fetchAccounts() {
  const data = await apiRequest(`${BASE_URL}/accounts`)
  return Array.isArray(data) ? data : data.accounts ?? []
}

export async function fetchTransactions(accountId) {
  return apiRequest(
    `${BASE_URL}/api/transactions/${accountId}?page=1&limit=5`
  )
}