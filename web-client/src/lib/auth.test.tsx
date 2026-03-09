// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { clearAuthSession, setAuthSession, useAuthSession } from './auth'

afterEach(() => {
  clearAuthSession()
})

describe('useAuthSession', () => {
  it('returns the same snapshot object when auth state has not changed', () => {
    setAuthSession('token-123', 'user')

    const { result, rerender } = renderHook(() => useAuthSession())
    const firstSnapshot = result.current

    rerender()

    expect(result.current).toBe(firstSnapshot)
  })

  it('returns a new snapshot when auth state changes', () => {
    const { result } = renderHook(() => useAuthSession())
    const firstSnapshot = result.current

    act(() => {
      setAuthSession('token-123', 'admin')
    })

    expect(result.current).not.toBe(firstSnapshot)
    expect(result.current).toEqual({ token: 'token-123', role: 'admin' })
  })
})
