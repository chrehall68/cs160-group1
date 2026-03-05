import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})
function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    // authentication stub
    router.navigate({ to: '/dashboard' })
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-6 rounded-lg bg-white/80 p-8 shadow-lg backdrop-blur"
      >
        <h2 className="text-2xl font-bold">Login</h2>

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
          className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
        >
          Sign in
        </button>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-[var(--lagoon)] hover:underline font-semibold"
          >
            Sign up
          </a>
        </p>
      </form>
    </main>
  )
}
