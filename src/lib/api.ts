import type {
  ApiCreateInvestmentPayload,
  ApiCreateLoginPayload,
  ApiCreateUserPayload,
  ApiInvestment,
  ApiInvestmentPage,
  ApiLogin,
  ApiUser,
} from '../types/models'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

type JsonCompatibleBody = RequestInit['body'] | object | null
type JsonRequestInit = Omit<RequestInit, 'body'> & { body?: JsonCompatibleBody }

export class ApiError extends Error {
  status: number
  payload?: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

const requiresSerialization = (body: JsonCompatibleBody): body is object | null => {
  if (body === undefined) return false
  if (body === null) return true
  if (Array.isArray(body)) return true
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return false
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return false
  return typeof body === 'object'
}

const ensureContentType = (headers: HeadersInit) => {
  if (headers instanceof Headers) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return
  }
  if (Array.isArray(headers)) {
    const hasContentType = headers.some(([key]) => key.toLowerCase() === 'content-type')
    if (!hasContentType) {
      headers.push(['Content-Type', 'application/json'])
    }
    return
  }
  const record = headers as Record<string, string>
  const hasContentType = Object.keys(record).some((key) => key.toLowerCase() === 'content-type')
  if (!hasContentType) {
    record['Content-Type'] = 'application/json'
  }
}

const request = async <T>(path: string, init: JsonRequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${path}`
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(init.headers ?? {}),
  }

  let body: BodyInit | undefined
  if (requiresSerialization(init.body)) {
    ensureContentType(headers)
    body = JSON.stringify(init.body)
  } else if (init.body !== undefined && init.body !== null) {
    body = init.body as BodyInit
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body,
  })

  const raw = await response.text()
  const parsed = raw ? JSON.parse(raw) : undefined

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === 'object' && 'detail' in parsed
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((parsed as any).detail as string | undefined)
        : undefined
    throw new ApiError(response.status, detail ?? response.statusText, parsed)
  }

  return parsed as T
}

export const listUsers = () => request<ApiUser[]>('/api/users')

export const createUser = (payload: ApiCreateUserPayload) =>
  request<ApiUser>('/api/users', {
    method: 'POST',
    body: payload,
  })

export const deleteUser = (userId: string) =>
  request<void>(`/api/users/${userId}`, {
    method: 'DELETE',
  })

export const listInvestments = (params: {
  limit?: number
  offset?: number
  user_id?: string
  status?: string
  type?: string
} = {}) => {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.offset) query.set('offset', String(params.offset))
  if (params.user_id) query.set('user_id', params.user_id)
  if (params.status) query.set('status', params.status)
  if (params.type) query.set('type', params.type)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<ApiInvestmentPage>(`/api/investments${suffix}`)
}

export const createInvestment = (payload: ApiCreateInvestmentPayload) =>
  request<ApiInvestment>('/api/investments', {
    method: 'POST',
    body: payload,
  })

export const deleteInvestment = (investmentId: string) =>
  request<void>(`/api/investments/${investmentId}`, {
    method: 'DELETE',
  })

export const recordLogin = (payload: ApiCreateLoginPayload) =>
  request<ApiLogin>('/api/logins', {
    method: 'POST',
    body: payload,
  })

export const apiBaseUrl = API_BASE_URL
