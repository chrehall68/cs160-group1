import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'
import { useState } from 'react'
import { getErrorMessage } from '../lib/api'
import { queryKeys, searchNearbyAtms } from '../lib/queries'
import type { ATMResult } from '../lib/queries'

export const Route = createFileRoute('/atm')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: ATM,
})

export default function ATM() {
  const [address, setAddress] = useState('')
  const [submittedAddress, setSubmittedAddress] = useState('')
  const atmQuery = useQuery<ATMResult[]>({
    queryKey: queryKeys.atmSearch(submittedAddress),
    queryFn: () => searchNearbyAtms(submittedAddress),
    enabled: Boolean(submittedAddress),
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmittedAddress(address.trim())
  }

  const results = atmQuery.data ?? []
  const searched = Boolean(submittedAddress)
  const loading = atmQuery.isFetching
  const error =
    atmQuery.isError && getErrorMessage(atmQuery.error, 'Search failed.')

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Find Nearby ATM</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">
              Enter Address, City, or Zip Code:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, San Jose, CA or 95112"
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {searched && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              {results.length > 0
                ? `${results.length} Chase ATM${results.length !== 1 ? 's' : ''} found near "${address}"`
                : `No Chase ATMs found near "${address}". Try a nearby city or broader area.`}
            </h3>
            <ul className="space-y-2">
              {results.map((atm, idx) => (
                <li key={idx} className="island-shell rounded p-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm">{atm.address}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-blue-600">{atm.distance} mi away</span>
                      {atm.open === true && <span className="text-xs text-green-600">Open now</span>}
                      {atm.open === false && <span className="text-xs text-red-500">Closed</span>}
                    </div>
                  </div>

                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(atm.address)}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline shrink-0 ml-4">Maps ↗</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
