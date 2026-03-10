import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/transfer')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Transfer,
})
function Transfer() {
  const [fromAccount, setFromAccount] = useState('checking')
  const [toAccount, setToAccount] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [startDate, setStartDate] = useState('')

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    // transfer logic stub
    if (isRecurring) {
      alert(
        `Recurring ${frequency} transfer submitted! Starting on ${startDate}`,
      )
    } else {
      alert('Transfer submitted!')
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-4 rounded-lg bg-white/80 p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold">Transfer Money</h2>

        <div>
          <label className="block text-sm font-medium">From Account:</label>
          <select
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="checking">Checking ••••1234</option>
            <option value="savings">Savings ••••8832</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            To Account Number:
          </label>
          <input
            type="text"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="Enter account number"
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Routing Number:</label>
          <input
            type="text"
            value={routingNumber}
            onChange={(e) => setRoutingNumber(e.target.value)}
            placeholder="Enter routing number"
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$0.00"
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="ml-2 text-sm font-medium">
              Set up recurring transfer
            </span>
          </label>
        </div>

        {isRecurring && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="block text-sm font-medium">Frequency:</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                required={isRecurring}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
        >
          Submit Transfer
        </button>
      </form>
    </main>
  )
}
