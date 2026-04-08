import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
  // === Existing Filter State ===
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')

  // === NEW: Database State ===
  const [users, setUsers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [dbTransactions, setDbTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // === NEW: Fetch Database Records ===
  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        // Change from fetch('/manager/...') to fetch('/api/manager/...')
        const [usersRes, customersRes, accountsRes, transactionsRes] = await Promise.all([
          fetch('/api/manager/users'),
          fetch('/api/manager/customers'),
          fetch('/api/manager/accounts'),
          fetch('/api/manager/transactions')
        ])

        if (usersRes.ok) setUsers(await usersRes.json())
        if (customersRes.ok) setCustomers(await customersRes.json())
        if (accountsRes.ok) setAccounts(await accountsRes.json())
        if (transactionsRes.ok) setDbTransactions(await transactionsRes.json())
        
      } catch (error) {
        console.error("Failed to fetch manager data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchManagerData()
  }, [])

  // === Existing Filter Logic ===
  const handleFilter = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    // filter logic stub
    alert('Filters applied!')
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>

        {/* Existing: Today's Statistics */}
        <div className="island-shell rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold">Today's Statistics</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Total Transactions: 134</li>
            <li>Total Deposits: $52,000</li>
            <li>Total Withdrawals: $18,400</li>
            <li>Total Transfers: $33,600</li>
          </ul>
        </div>

        {/* Existing: Filter Form */}
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

        {/* Existing: Recent Bank Transactions */}
        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Recent Bank Transactions
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="px-4 py-2 text-left island-kicker">Date</th>
                <th className="px-4 py-2 text-left island-kicker">Type</th>
                <th className="px-4 py-2 text-left island-kicker">Amount</th>
                <th className="px-4 py-2 text-left island-kicker">Zip Code</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--line)]">
                <td className="px-4 py-2">03/02</td>
                <td className="px-4 py-2">Deposit</td>
                <td className="px-4 py-2">$500</td>
                <td className="px-4 py-2">95112</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
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

        {/* === NEW: DATABASE OVERVIEW TABLES === */}
        <h2 className="text-2xl font-bold mt-12 mb-2 border-b border-[var(--line)] pb-2">Database Overview</h2>
        
        {loading ? (
          <p className="text-[var(--sea-ink-soft)] font-medium">Loading live database records...</p>
        ) : (
          <div className="space-y-8">
            
            {/* USERS TABLE */}
            <div className="island-shell p-6 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-[var(--sea-ink)]">System Users</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-2 text-left island-kicker">User ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Username</th>
                    <th className="px-4 py-2 text-left island-kicker">Role</th>
                    <th className="px-4 py-2 text-left island-kicker">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-[var(--line)] hover:bg-[var(--foam)] transition-colors">
                      <td className="px-4 py-2">{user.user_id}</td>
                      <td className="px-4 py-2 font-medium">{user.username}</td>
                      <td className="px-4 py-2 uppercase text-xs">{user.role}</td>
                      <td className="px-4 py-2 uppercase text-xs">{user.status}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No users found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* CUSTOMERS TABLE */}
            <div className="island-shell p-6 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-[var(--sea-ink)]">Customers</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-2 text-left island-kicker">Cust ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Name</th>
                    <th className="px-4 py-2 text-left island-kicker">Email</th>
                    <th className="px-4 py-2 text-left island-kicker">KYC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust.customer_id} className="border-b border-[var(--line)] hover:bg-[var(--foam)] transition-colors">
                      <td className="px-4 py-2">{cust.customer_id}</td>
                      <td className="px-4 py-2">{cust.first_name} {cust.last_name}</td>
                      <td className="px-4 py-2">{cust.email}</td>
                      <td className="px-4 py-2 uppercase text-xs font-semibold">{cust.kyc_status}</td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No customers found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* ACCOUNTS TABLE */}
            <div className="island-shell p-6 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-[var(--sea-ink)]">Bank Accounts</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-2 text-left island-kicker">Account ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Cust ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Type</th>
                    <th className="px-4 py-2 text-left island-kicker">Status</th>
                    <th className="px-4 py-2 text-right island-kicker">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.account_id} className="border-b border-[var(--line)] hover:bg-[var(--foam)] transition-colors">
                      <td className="px-4 py-2">{acc.account_id}</td>
                      <td className="px-4 py-2">{acc.customer_id}</td>
                      <td className="px-4 py-2 capitalize">{acc.account_type}</td>
                      <td className="px-4 py-2 capitalize">{acc.status}</td>
                      <td className="px-4 py-2 text-right font-bold">${Number(acc.balance).toFixed(2)}</td>
                    </tr>
                  ))}
                  {accounts.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No accounts found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* FULL TRANSACTIONS TABLE */}
            <div className="island-shell p-6 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-[var(--sea-ink)]">All Transactions Log</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-2 text-left island-kicker">Txn ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Account ID</th>
                    <th className="px-4 py-2 text-left island-kicker">Type</th>
                    <th className="px-4 py-2 text-left island-kicker">Status</th>
                    <th className="px-4 py-2 text-right island-kicker">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dbTransactions.map((txn) => (
                    <tr key={txn.transaction_id} className="border-b border-[var(--line)] hover:bg-[var(--foam)] transition-colors">
                      <td className="px-4 py-2">{txn.transaction_id}</td>
                      <td className="px-4 py-2">{txn.account_id}</td>
                      <td className="px-4 py-2 capitalize">{txn.transaction_type.replace('_', ' ')}</td>
                      <td className="px-4 py-2 uppercase text-xs font-semibold">{txn.status}</td>
                      <td className="px-4 py-2 text-right font-bold">${Number(txn.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {dbTransactions.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No transactions found</td></tr>}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </section>
    </main>
  )
}