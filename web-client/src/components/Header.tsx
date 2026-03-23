import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { clearAuthSession, useAuthSession } from '../lib/auth'

export default function Header() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const auth = useAuthSession()
  const isLoggedIn = Boolean(auth.token)
  const isAdmin = auth.role === 'admin'

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch {
      // Local logout still proceeds if server logout fails.
    } finally {
      queryClient.clear()
      clearAuthSession()
      router.navigate({ to: '/login' })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Online Bank
          </Link>
        </h2>
        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Dashboard
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/accounts"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Accounts
            </Link>
          )}

          {isLoggedIn && (
            <Link
            to="/deposit"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
            >
              Deposit
            </Link>
          )}

          {isLoggedIn && (
            <Link
            to="/withdraw"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
            >
              Withdraw
            </Link>
          )}
          {isLoggedIn && (
            <Link
              to="/transfer"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Transfer
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/atm"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              ATM
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/manager"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Manager
            </Link>
          )}

          {!isLoggedIn && (
            <Link
              to="/login"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Login
            </Link>
          )}

          {!isLoggedIn && (
            <Link
              to="/signup"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Signup
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/profile"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Profile
            </Link>
          )}

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="nav-link cursor-pointer border-0 bg-transparent p-0"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
