import { DecimalInput } from '#/components/DecimalInput'
import { fetchAccounts, queryKeys } from '#/lib/queries'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/transfer')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Transfer,
})
function Transfer() {
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [startDate, setStartDate] = useState('')
  const queryClient = useQueryClient()
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })

  useEffect(() => {
    if (!selectedAccountId && accountsQuery.data?.length) {
      setSelectedAccountId(String(accountsQuery.data[0].account_id))
    }
  }, [accountsQuery.data, selectedAccountId])

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
          <label className="block text-sm font-medium">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            disabled={accountsQuery.isLoading || !accountsQuery.data?.length}
          >
            {accountsQuery.data?.map((account) => (
              <option key={account.account_id} value={account.account_id}>
                {account.account_type} ••••{account.account_number.slice(-4)}
              </option>
            ))}
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
          <DecimalInput val={amount} setVal={setAmount} />
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="ml-2 text-sm font-medium">Schedule for later</span>
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
                <option value="once">Once</option>
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
          className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
        >
          Submit Transfer
        </button>
      </form>
    </main>
  )
}
