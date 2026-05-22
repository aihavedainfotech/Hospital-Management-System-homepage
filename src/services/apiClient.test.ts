import { beforeEach, describe, expect, it } from 'vitest'
import apiClient from './apiClient'

describe('apiClient interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('adds a bearer token from localStorage to outgoing requests', async () => {
    localStorage.setItem('token', 'primary-token')
    const handler = (apiClient.interceptors.request as any).handlers[0].fulfilled

    const config = await handler({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer primary-token')
  })

  it('falls back to access_token when token is absent', async () => {
    localStorage.setItem('access_token', 'fallback-token')
    const handler = (apiClient.interceptors.request as any).handlers[0].fulfilled

    const config = await handler({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer fallback-token')
  })

  it('clears auth state and redirects on 401 responses', async () => {
    localStorage.setItem('token', 'expired-token')
    localStorage.setItem('hms_user', '{}')
    localStorage.setItem('user', '{}')
    localStorage.setItem('access_token', 'expired-access')
    const handler = (apiClient.interceptors.response as any).handlers[0].rejected

    await expect(handler({ response: { status: 401, data: {} } })).rejects.toBeTruthy()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('hms_user')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(window.location.pathname).toBe('/login')
  })

  it('treats JWT-looking 500 errors as auth failures', async () => {
    localStorage.setItem('token', 'expired-token')
    const handler = (apiClient.interceptors.response as any).handlers[0].rejected

    await expect(handler({
      response: { status: 500, data: { error: 'token signature expired' } },
    })).rejects.toBeTruthy()

    expect(localStorage.getItem('token')).toBeNull()
    expect(window.location.pathname).toBe('/login')
  })
})
