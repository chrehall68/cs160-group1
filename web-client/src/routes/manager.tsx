import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { isAdmin, isAuthenticated } from '@/lib/auth'
import { DecimalInput } from '@/components/Inputs'

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

// ── Pagination controls shared by every table ──────────────────────────
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded bg-[var(--lagoon)] px-3 py-1 text-white disabled:opacity-40"
      >
        Previous
      </button>
      <span>
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded bg-[var(--lagoon)] px-3 py-1 text-white disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

// ── Generic hook: paginated + filtered fetch ────────────────────────────
function usePaginatedFetch<T>(
  baseUrl: string,
  filters: Record<string, string>,
  limit = 10,
) {
  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v)
      }
      const res = await fetch(`${baseUrl}?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setTotalPages(json.total_pages)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, page, limit, JSON.stringify(filters)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset to page 1 when filters change
  const applyFilters = () => setPage(1)

  return { data, page, totalPages, loading, setPage, applyFilters }
}

// ── Small filter input helpers ──────────────────────────────────────────
function FilterInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded border px-2 py-1 text-sm"
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function FilterBar({
  children,
  onApply,
}: {
  children: React.ReactNode
  onApply: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      {children}
      <button
        onClick={onApply}
        className="rounded bg-[var(--lagoon)] px-3 py-1 text-sm font-semibold text-white hover:bg-[var(--lagoon-deep)]"
      >
        Apply
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────
function ManagerDashboard() {
  // Users filters
  const [usernameFilter, setUsernameFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('')

  const users = usePaginatedFetch<any>(
    '/api/manager/users',
    { username: usernameFilter, role: roleFilter, user_status: userStatusFilter },
  )

  // Customers filters
  const [nameFilter, setNameFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [kycFilter, setKycFilter] = useState('')

  const customers = usePaginatedFetch<any>(
    '/api/manager/customers',
    { name: nameFilter, email: emailFilter, kyc_status: kycFilter },
  )

  // Accounts filters
  const [acctTypeFilter, setAcctTypeFilter] = useState('')
  const [acctStatusFilter, setAcctStatusFilter] = useState('')
  const [minBalanceFilter, setMinBalanceFilter] = useState('')

  const accounts = usePaginatedFetch<any>(
    '/api/manager/accounts',
    { account_type: acctTypeFilter, account_status: acctStatusFilter, min_balance: minBalanceFilter },
  )

  // Transactions filters
  const [txnTypeFilter, setTxnTypeFilter] = useState('')
  const [txnStatusFilter, setTxnStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')

  const transactions = usePaginatedFetch<any>(
    '/api/manager/transactions',
    {
      transaction_type: txnTypeFilter,
      transaction_status: txnStatusFilter,
      start_date: startDate,
      end_date: endDate,
      min_amount: minAmount,
    },
  )

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>

        {/* ── USERS ─────────────────────────────────────── */}
        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">System Users</h3>

          <FilterBar onApply={users.applyFilters}>
            <FilterInput label="Username" value={usernameFilter} onChange={setUsernameFilter} placeholder="Search..." />
            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={userStatusFilter}
              onChange={setUserStatusFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'locked', label: 'Locked' },
              ]}
            />
          </FilterBar>

          {users.loading ? (
            <p className="text-[var(--sea-ink-soft)]">Loading...</p>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="island-kicker px-4 py-2 text-left">User ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Username</th>
                    <th className="island-kicker px-4 py-2 text-left">Role</th>
                    <th className="island-kicker px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u: any) => (
                    <tr key={u.user_id} className="border-b border-[var(--line)] transition-colors hover:bg-[var(--foam)]">
                      <td className="px-4 py-2">{u.user_id}</td>
                      <td className="px-4 py-2 font-medium">{u.username}</td>
                      <td className="px-4 py-2 text-xs uppercase">{u.role}</td>
                      <td className="px-4 py-2 text-xs uppercase">{u.status}</td>
                    </tr>
                  ))}
                  {users.data.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={users.page} totalPages={users.totalPages} onPage={users.setPage} />
            </>
          )}
        </div>

        {/* ── CUSTOMERS ─────────────────────────────────── */}
        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Customers</h3>

          <FilterBar onApply={customers.applyFilters}>
            <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} placeholder="Search..." />
            <FilterInput label="Email" value={emailFilter} onChange={setEmailFilter} placeholder="Search..." />
            <FilterSelect
              label="KYC Status"
              value={kycFilter}
              onChange={setKycFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </FilterBar>

          {customers.loading ? (
            <p className="text-[var(--sea-ink-soft)]">Loading...</p>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="island-kicker px-4 py-2 text-left">Cust ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Name</th>
                    <th className="island-kicker px-4 py-2 text-left">Email</th>
                    <th className="island-kicker px-4 py-2 text-left">KYC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.data.map((c: any) => (
                    <tr key={c.customer_id} className="border-b border-[var(--line)] transition-colors hover:bg-[var(--foam)]">
                      <td className="px-4 py-2">{c.customer_id}</td>
                      <td className="px-4 py-2">{c.first_name} {c.last_name}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2 text-xs font-semibold uppercase">{c.kyc_status}</td>
                    </tr>
                  ))}
                  {customers.data.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No customers found</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={customers.page} totalPages={customers.totalPages} onPage={customers.setPage} />
            </>
          )}
        </div>

        {/* ── ACCOUNTS ──────────────────────────────────── */}
        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Bank Accounts</h3>

          <FilterBar onApply={accounts.applyFilters}>
            <FilterSelect
              label="Type"
              value={acctTypeFilter}
              onChange={setAcctTypeFilter}
              options={[
                { value: 'checking', label: 'Checking' },
                { value: 'savings', label: 'Savings' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={acctStatusFilter}
              onChange={setAcctStatusFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' },
                { value: 'frozen', label: 'Frozen' },
              ]}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Min Balance</label>
              <DecimalInput val={minBalanceFilter} setVal={setMinBalanceFilter} className="mt-0! w-auto! px-2! py-1! text-sm" />
            </div>
          </FilterBar>

          {accounts.loading ? (
            <p className="text-[var(--sea-ink-soft)]">Loading...</p>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="island-kicker px-4 py-2 text-left">Account ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Cust ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Type</th>
                    <th className="island-kicker px-4 py-2 text-left">Status</th>
                    <th className="island-kicker px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.data.map((a: any) => (
                    <tr key={a.account_id} className="border-b border-[var(--line)] transition-colors hover:bg-[var(--foam)]">
                      <td className="px-4 py-2">{a.account_id}</td>
                      <td className="px-4 py-2">{a.customer_id}</td>
                      <td className="px-4 py-2 capitalize">{a.account_type}</td>
                      <td className="px-4 py-2 capitalize">{a.status}</td>
                      <td className="px-4 py-2 text-right font-bold">${Number(a.balance).toFixed(2)}</td>
                    </tr>
                  ))}
                  {accounts.data.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No accounts found</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={accounts.page} totalPages={accounts.totalPages} onPage={accounts.setPage} />
            </>
          )}
        </div>

        {/* ── TRANSACTIONS ──────────────────────────────── */}
        <div className="island-shell overflow-x-auto rounded-lg p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">All Transactions Log</h3>

          <FilterBar onApply={transactions.applyFilters}>
            <FilterSelect
              label="Type"
              value={txnTypeFilter}
              onChange={setTxnTypeFilter}
              options={[
                { value: 'atm_deposit', label: 'ATM Deposit' },
                { value: 'online_deposit', label: 'Online Deposit' },
                { value: 'withdrawal', label: 'Withdrawal' },
                { value: 'transfer', label: 'Transfer' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={txnStatusFilter}
              onChange={setTxnStatusFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <FilterInput label="Start Date" value={startDate} onChange={setStartDate} type="date" />
            <FilterInput label="End Date" value={endDate} onChange={setEndDate} type="date" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Min Amount</label>
              <DecimalInput val={minAmount} setVal={setMinAmount} className="mt-0! w-auto! px-2! py-1! text-sm" />
            </div>
          </FilterBar>

          {transactions.loading ? (
            <p className="text-[var(--sea-ink-soft)]">Loading...</p>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="island-kicker px-4 py-2 text-left">Txn ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Account ID</th>
                    <th className="island-kicker px-4 py-2 text-left">Type</th>
                    <th className="island-kicker px-4 py-2 text-left">Status</th>
                    <th className="island-kicker px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.data.map((t: any) => (
                    <tr key={t.transaction_id} className="border-b border-[var(--line)] transition-colors hover:bg-[var(--foam)]">
                      <td className="px-4 py-2">{t.transaction_id}</td>
                      <td className="px-4 py-2">{t.account_id}</td>
                      <td className="px-4 py-2 capitalize">{t.transaction_type.replace('_', ' ')}</td>
                      <td className="px-4 py-2 text-xs font-semibold uppercase">{t.status}</td>
                      <td className="px-4 py-2 text-right font-bold">${Number(t.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {transactions.data.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={transactions.page} totalPages={transactions.totalPages} onPage={transactions.setPage} />
            </>
          )}
        </div>
      </section>
    </main>
  )
}
