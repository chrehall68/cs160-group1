import Account from '@/components/Account'
import '@/lib/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiRequest, getErrorMessage } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { fetchAccounts, queryKeys } from '@/lib/queries'

export const Route = createFileRoute('/accounts/')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Accounts,
})

function Accounts() {
  const [accountType, setAccountType] = useState('checking')
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })

  const createAccountMutation = useMutation({
    mutationFn: async () =>
      apiRequest('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    },
  })

  const error =
    (accountsQuery.isError &&
      getErrorMessage(accountsQuery.error, 'Unable to load accounts.')) ||
    (createAccountMutation.isError &&
      getErrorMessage(
        createAccountMutation.error,
        'Unable to create account.',
      )) ||
    null

  async function createAccount(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)

    try {
      await createAccountMutation.mutateAsync()
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
            {accountsQuery.isLoading ? (
              <div className="rounded-lg bg-white/80 p-6 shadow-md">
                <p className="text-(--sea-ink-soft)">Loading accounts...</p>
              </div>
            ) : (accountsQuery.data?.length ?? 0) > 0 ? (
              accountsQuery.data!.map((account) => (
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
                  Create a checking or savings account today!
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
