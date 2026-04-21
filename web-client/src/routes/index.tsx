import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 text-center">
        <h1 className="display-title mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
          Welcome to Online Bank
        </h1>
        <p className="mb-6 text-lg text-(--sea-ink-soft)">
          Your one-stop banking dashboard. Log in to view accounts, transfer
          funds, or locate ATMs.
        </p>
        <a
          href="/login"
          className="inline-block rounded-full bg-(--lagoon) px-6 py-3 font-semibold shadow text-white! hover:bg-(--lagoon-deep) hover:text-white"
        >
          Sign In
        </a>
      </section>
    </main>
  )
}
