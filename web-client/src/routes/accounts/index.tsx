import Account from '#/components/Account'
import '@/lib/types'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { isAuthenticated } from '../../lib/auth'

export const Route = createFileRoute('/accounts/')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Accounts,
})

function Accounts() {
  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [accountType, setAccountType] = useState('checking')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  async function getAccounts() {
    setIsLoading(true)

    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail)
      }

      setAccounts(data.accounts)
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

  async function createAccount(event: React.SubmitEvent<HTMLFormElement>) {
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
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <Account
                  key={account.account_id}
                  account={account}
                  className="hover:cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: `/accounts/$accountId`,
                      params: { accountId: `${account.account_id}` },
                    })
                  }
                />
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
                className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-(--lagoon-deep) disabled:cursor-not-allowed disabled:opacity-70"
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
