import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiRequest, getErrorMessage } from '../lib/api'
import { fetchAccounts, queryKeys } from '../lib/queries'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/deposit')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Deposit,
})

function Deposit() {
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [street, setStreet] = useState('')
  const [unit, setUnit] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [country, setCountry] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
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

  const depositMutation = useMutation({
    mutationFn: (parsedAmount: number) =>
      apiRequest('/api/deposit/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: Number(selectedAccountId),
          cash_amount: parsedAmount,
          atm_address: {
            street,
            unit: unit || undefined,
            city,
            state,
            zipcode,
            country,
          },
        }),
      }),
    onSuccess: async () => {
      setSuccess('Deposit submitted successfully.')
      setAmount('')
      setStreet('')
      setUnit('')
      setCity('')
      setState('')
      setZipcode('')
      setCountry('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.accountTransactions(selectedAccountId),
      })
    },
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    setSuccess('')

    const parsedAmount = parseFloat(amount)
    if (!selectedAccountId || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid account and amount.')
      return
    }

    try {
      await depositMutation.mutateAsync(parsedAmount)
    } catch {}
  }

  const error =
    formError ||
    (accountsQuery.isError &&
      getErrorMessage(accountsQuery.error, 'Could not load accounts.')) ||
    (!selectedAccountId && !accountsQuery.isLoading
      ? 'Please create an account before making a deposit.'
      : '') ||
    (depositMutation.isError &&
      getErrorMessage(depositMutation.error, 'Deposit failed.')) ||
    ''

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-4 rounded-lg bg-white/80 p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold">Deposit Money</h2>

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
          <label className="block text-sm font-medium">Amount:</label>
          <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
        
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold">ATM Address</h3>
        </div>

        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Street"
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit (optional)"
          className="w-full rounded border px-3 py-2"
        />

        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          type="text"
          value={zipcode}
          onChange={(e) => setZipcode(e.target.value)}
          placeholder="Zipcode"
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          className="w-full rounded border px-3 py-2"
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={depositMutation.isPending || accountsQuery.isLoading}
          className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)] disabled:opacity-70"
        >
          {depositMutation.isPending ? 'Submitting...' : 'Submit Deposit'}
        </button>
      </form>
    </main>
  )
}
