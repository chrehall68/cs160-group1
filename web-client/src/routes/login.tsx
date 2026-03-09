import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { isAuthenticated, setAuthSession } from '../lib/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Login,
})

interface LoginResponse {
  access_token: string
  role: 'user' | 'admin'
}

function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.detail ?? 'Invalid username or password')
        return
      }

      const data = (await response.json()) as LoginResponse
      if (!data.access_token) {
        setError('Login succeeded but auth session could not be created')
        return
      }

      setAuthSession(data.access_token, data.role)
      router.navigate({ to: '/dashboard' })
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-6 rounded-lg bg-white/80 p-8 shadow-lg backdrop-blur"
      >
        <h2 className="text-2xl font-bold">Login</h2>

        {error && (
          <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Enter password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-[var(--lagoon)] hover:underline font-semibold"
          >
            Sign up
          </Link>
        </p>
      </form>
    </main>
  )
}
