import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchCustomer, fetchAccounts, fetchTransactions, queryKeys } from '../lib/queries'
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
  const customerQuery = useQuery({
    queryKey: queryKeys.customer,
    queryFn: fetchCustomer,
  })
  const name = customerQuery.data?.first_name || 'User'

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })

  const transactionsQuery = useQuery({
    queryKey: ['recent-transactions', accountsQuery.data],
    enabled: !!accountsQuery.data,
    queryFn: async () => {
      if (!accountsQuery.data) return []

      const allTransactions = await Promise.all(
        accountsQuery.data.map((acc) =>
          fetchTransactions(String(acc.account_id), 1, 5)
        )
      )

      const combined = allTransactions.flatMap((res) => res.transactions)

      return combined.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
    },
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Welcome back {name}!</h2>
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

        <div className="rounded-lg bg-white/80 p-6 shadow-md">
          <h3 className="mb-4 font-semibold">Recent Activity</h3>

          {transactionsQuery.data?.slice(0, 5).map((tx) => {
            const isCredit = tx.type === 'credit'

            return (
              <div
                key={tx.transaction_id}
                className="flex justify-between border-b py-2 text-sm"
              >
                <span className="capitalize">{tx.type}</span>

                <span className={isCredit ? 'text-green-600' : 'text-red-500'}>
                  {isCredit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </span>
              </div>
            )
          })}

          {!transactionsQuery.data?.length && (
            <p className="text-sm text-gray-500">
              No recent transactions
            </p>
          )}
        </div>
      </section>
    </main>
  )
}