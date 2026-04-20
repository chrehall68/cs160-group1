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

const UPPERCASE_WORDS = new Set(['ssn', 'id', 'dob', 'zip'])

function humanizeFieldSegment(segment: string): string {
  if (UPPERCASE_WORDS.has(segment.toLowerCase())) {
    return segment.toUpperCase()
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

function formatValidationLocation(loc: unknown): string | null {
  if (!Array.isArray(loc)) {
    return null
  }
  // drop the leading "body"/"query"/"path" segment that FastAPI prepends
  const parts = loc
    .slice(1)
    .filter((p) => typeof p === 'string' || typeof p === 'number')
    .flatMap((p) => String(p).split('_'))
    .map(humanizeFieldSegment)
  return parts.length > 0 ? parts.join(' ') : null
}

function cleanValidationMessage(msg: string): string {
  // Pydantic prefixes custom-validator messages with "Value error, "
  return msg.replace(/^Value error,\s*/i, '')
}

function getMessageFromData(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') {
    return fallback
  }

  const record = data as Record<string, unknown>

  if (typeof record.detail === 'string') {
    return record.detail
  }

  // FastAPI validation errors: detail is an array of { loc, msg, type }
  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const messages = record.detail
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const entry = item as Record<string, unknown>
        const msg =
          typeof entry.msg === 'string'
            ? cleanValidationMessage(entry.msg)
            : null
        if (!msg) return null
        const field = formatValidationLocation(entry.loc)
        return field ? `${field}: ${msg}` : msg
      })
      .filter((m): m is string => m !== null)
    if (messages.length > 0) {
      return messages.join('\n')
    }
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
