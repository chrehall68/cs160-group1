import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
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

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <ThemeToggle />
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/dashboard"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Dashboard
          </Link>
          <Link
            to="/accounts"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Accounts
          </Link>
          <Link
            to="/transfer"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Transfer
          </Link>
          <Link
            to="/atm"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            ATM
          </Link>
          <Link
            to="/login"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Login
          </Link>
          <Link
            to="/manager"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Manager
          </Link>
        </div>
      </nav>
    </header>
  )
}
