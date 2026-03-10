import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})
function Dashboard() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Welcome back!</h2>
        <p className="text-lg text-[var(--sea-ink-soft)]">
          Here's a quick overview of your accounts and recent activity.
        </p>

        <div className="rounded-lg bg-white/80 p-6 shadow-md">
          <h3 className="font-semibold">Checking Account</h3>
          <p>Account Number: ••••1234</p>
          <p>Balance: $2,100.20</p>
          <p>Status: Active</p>
        </div>

        <div className="rounded-lg bg-white/80 p-6 shadow-md">
          <h3 className="font-semibold">Savings Account</h3>
          <p>Account Number: ••••8832</p>
          <p>Balance: $2,130.34</p>
          <p>Status: Active</p>
        </div>
      </section>
    </main>
  )
}
