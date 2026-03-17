import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/accounts')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Accounts,
})

interface Account {
  account_id: number
  account_number: string
  balance: number | string
  account_type: string
  status?: string
}

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountType, setAccountType] = useState('checking')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const activeAccounts = accounts.filter(
    (account) => (account.status ?? '').toLowerCase() === 'active',
  )

  async function getAccounts() {
    setIsLoading(true)

    try {
      const res = await fetch('/api/accounts')
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail ?? 'Unable to load accounts.')
      }

      setAccounts(Array.isArray(data?.accounts) ? data.accounts : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError(err instanceof Error ? err.message : 'Unable to load accounts.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getAccounts()
  }, [])

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)

    try {
      const res = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.detail ?? 'Unable to create account.')
      }

      setError(null)
      await getAccounts()
    } catch (err) {
      console.error('Error creating account:', err)
      setError(err instanceof Error ? err.message : 'Unable to create account.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Accounts</h2>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-lg bg-white/80 p-6 shadow-md">
                <p className="text-(--sea-ink-soft)">Loading accounts...</p>
              </div>
            ) : activeAccounts.length > 0 ? (
              activeAccounts.map((account) => (
                <div
                  key={account.account_id}
                  className="rounded-lg bg-white/80 p-6 shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {toTitleCase(account.account_type)} Account
                      </h3>
                      <p className="mt-1 text-sm text-(--sea-ink-soft)">
                        Account Number:{' '}
                        {maskAccountNumber(account.account_number)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md bg-[rgba(255,255,255,0.55)] p-4">
                      <p className="text-sm text-(--sea-ink-soft)">
                        Available Balance
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <div className="rounded-md bg-[rgba(255,255,255,0.55)] p-4">
                      <p className="text-sm text-(--sea-ink-soft)">
                        Account Type
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {toTitleCase(account.account_type)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-white/80 p-6 shadow-md">
                <p className="font-semibold">No active accounts found.</p>
                <p className="mt-1 text-sm text-(--sea-ink-soft)">
                  Use the panel on the right to create a checking or savings
                  account.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-lg bg-white/80 p-6 shadow-md lg:self-start">
            <h3 className="font-semibold">Create a New Account</h3>
            <form onSubmit={createAccount} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="account-type"
                  className="block text-sm font-medium"
                >
                  Account Type
                </label>
                <select
                  id="account-type"
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value)}
                  className="mt-1 w-full rounded border border-(--line) bg-white px-3 py-2"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreating ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  )
}

function formatCurrency(value: number | string) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '$0.00'
  }

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function maskAccountNumber(accountNumber: string) {
  return `••••${accountNumber.slice(-4)}`
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
