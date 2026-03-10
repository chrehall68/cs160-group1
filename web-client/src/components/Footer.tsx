import ThemeToggle from './ThemeToggle'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--header-bg)] px-4 py-6 backdrop-blur-lg">
      <div className="page-wrap flex flex-col gap-4 text-sm text-[var(--sea-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 font-semibold text-[var(--sea-ink)]">Online Bank</p>
          <p className="m-0">Copyright 2026 Online Bank. All rights reserved.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
            Appearance
          </span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
