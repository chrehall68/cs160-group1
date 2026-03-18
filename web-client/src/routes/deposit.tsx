import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/deposit')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Deposit,
})

function Deposit() {
  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [street, setStreet] = useState('')
  const [unit, setUnit] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts')
        if (!response.ok) {
          throw new Error('Failed to load accounts')
        }
        const data = await response.json()
        const fetchedAccounts = data.accounts ?? data
        setAccounts(fetchedAccounts)

        if (fetchedAccounts.length > 0) {
          setSelectedAccountId(String(fetchedAccounts[0].account_id))
        }
      } catch (err) {
        console.error(err)
        setError('Could not load accounts.')
      }
    }

    fetchAccounts()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const parsedAmount = parseFloat(amount)
    if (!selectedAccountId || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid account and amount.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/deposit/cash', {
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
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.reason || 'Deposit failed.')
      }

      setSuccess('Deposit submitted successfully.')
      setAmount('')
      setStreet('')
      setUnit('')
      setCity('')
      setState('')
      setZipcode('')
      setCountry('')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Deposit failed.')
    } finally {
      setLoading(false)
    }
  }

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
          >
            {accounts.map((account) => (
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
          disabled={loading}
          className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)] disabled:opacity-70"
        >
          {loading ? 'Submitting...' : 'Submit Deposit'}
        </button>
      </form>
    </main>
  )
}