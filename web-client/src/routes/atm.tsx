import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/atm')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: ATM,
})

type ATMResult = {
  address: string
  distance: string
  open: boolean | null
  lat: number
  lng: number
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1609.344
}

export default function ATM() {
  const [address, setAddress] = useState('')
  const [results, setResults] = useState<ATMResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults([])
    setSearched(false)

    try {
      const geoRes = await fetch(`/api/atm/geocode?address=${encodeURIComponent(address)}`)
      const geoData = await geoRes.json()
      if (!geoData.results?.length)
        throw new Error('Location not found. Try a full address, city, or zip code.')
      const { lat, lng } = geoData.results[0].geometry.location

      const placesRes = await fetch(`/api/atm/nearby?lat=${lat}&lng=${lng}`)
      const placesData = await placesRes.json()

      const atms: ATMResult[] = (placesData.results || [])
        .filter((p: any) =>
          p.name.toLowerCase().includes('chase') ||
          p.international_phone_number === '+1 800-935-9935'
        )
        .map((p: any) => ({
          address: p.vicinity,
          distance: haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng).toFixed(1),
          open: p.opening_hours?.open_now ?? null,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        }))
        .sort((a: ATMResult, b: ATMResult) => parseFloat(a.distance) - parseFloat(b.distance))
        .filter((atm: ATMResult, index: number, self: ATMResult[]) =>
          index === self.findIndex((a) => a.address === atm.address)
        )

      setResults(atms)
      setSearched(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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