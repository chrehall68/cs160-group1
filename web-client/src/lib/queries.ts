import { apiRequest, isApiError } from './api'

export type Customer = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
}

export type ATMResult = {
  address: string
  distance: string
  open: boolean | null
  lat: number
  lng: number
}

type AccountsResponse = {
  accounts?: AccountType[]
}

type TransactionsResponse = {
  transactions: TransactionType[]
  total_pages: number
}

type ATMGeocodeResponse = {
  results?: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
}

type ATMNearbyResponse = {
  results?: ATMResult[]
}

export const queryKeys = {
  customer: ['customer'] as const,
  accounts: ['accounts'] as const,
  account: (accountId: string) => ['accounts', accountId] as const,
  transactionsRoot: ['transactions'] as const,
  accountTransactions: (accountId: string) =>
    ['transactions', accountId] as const,
  transactions: (accountId: string, page: number, limit: number) =>
    ['transactions', accountId, page, limit] as const,
  atmSearch: (address: string) => ['atm-search', address] as const,
}

export async function fetchCustomer() {
  try {
    return await apiRequest<Customer>('/api/customer')
  } catch (error) {
    // If it's the 400 "Customer not found" error, return dummy admin data!
    if (isApiError(error) && error.status === 400) {
      return {
        first_name: 'System',
        last_name: 'Admin',
        email: 'admin@onlinebank.com',
        phone: 'N/A',
      }
    }
    // If it's a real error, throw it normally.
    throw error
  }
}

export async function fetchAccounts() {
  const data = await apiRequest<AccountsResponse | AccountType[]>('/api/accounts')
  return Array.isArray(data) ? data : (data.accounts ?? [])
}

export async function fetchAccount(accountId: string) {
  return apiRequest<AccountType>(`/api/accounts/${accountId}`)
}

export async function fetchTransactions(
  accountId: string,
  page: number,
  limit: number,
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  return apiRequest<TransactionsResponse>(
    `/api/transactions/${accountId}?${searchParams.toString()}`,
  )
}

export async function searchNearbyAtms(address: string) {
  const geoData = await apiRequest<ATMGeocodeResponse>(
    `/api/atm/geocode?address=${encodeURIComponent(address)}`,
  )

  const location = geoData.results?.[0]?.geometry.location

  if (!location) {
    throw new Error('Location not found. Try a full address, city, or zip code.')
  }

  const placesData = await apiRequest<ATMNearbyResponse>(
    `/api/atm/nearby?lat=${location.lat}&lng=${location.lng}`,
  )

  return placesData.results ?? []
}