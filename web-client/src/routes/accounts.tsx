import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/accounts')({
  component: Accounts,
})

function Accounts() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Your Accounts</h2>

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
