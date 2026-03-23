export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getMessageFromData(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') {
    return fallback
  }

  const record = data as Record<string, unknown>

  if (typeof record.detail === 'string') {
    return record.detail
  }

  if (typeof record.reason === 'string') {
    return record.reason
  }

  if (typeof record.message === 'string') {
    return record.message
  }

  return fallback
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json().catch(() => null)
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init)
  const data = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError(
      getMessageFromData(data, `Request failed with status ${response.status}.`),
      response.status,
      data,
    )
  }

  return data as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
