import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { isAdmin, isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/manager')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }

    if (!isAdmin()) {
      throw redirect({ to: '/accounts' })
    }
  },
  component: ManagerDashboard,
})

function ManagerDashboard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')

  const handleFilter = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    // filter logic stub
    alert('Filters applied!')
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>

        <div className="island-shell rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold">Today's Statistics</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Total Transactions: 134</li>
            <li>Total Deposits: $52,000</li>
            <li>Total Withdrawals: $18,400</li>
            <li>Total Transfers: $33,600</li>
          </ul>
        </div>

        <form
          onSubmit={handleFilter}
          className="island-shell space-y-4 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold">Filter Transactions</h3>

          <div>
            <label className="block text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Minimum Amount:</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="$0.00"
              className="mt-1 rounded border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
          >
            Apply Filters
          </button>
        </form>

        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Recent Bank Transactions
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Zip Code</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2">03/02</td>
                <td className="px-4 py-2">Deposit</td>
                <td className="px-4 py-2">$500</td>
                <td className="px-4 py-2">95112</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2">03/01</td>
                <td className="px-4 py-2">Transfer</td>
                <td className="px-4 py-2">$800</td>
                <td className="px-4 py-2">94087</td>
              </tr>
              <tr>
                <td className="px-4 py-2">02/28</td>
                <td className="px-4 py-2">Withdrawal</td>
                <td className="px-4 py-2">$60</td>
                <td className="px-4 py-2">95050</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
