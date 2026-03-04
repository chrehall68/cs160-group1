import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/atm')({
  component: ATM,
})
export default function ATM() {
  const [city, setCity] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSearched(true)
  }

  const results = [
    { address: '123 MLK Lib', city: 'San Jose', state: 'CA', zip: '95112' },
    { address: '456 Market St', city: 'San Jose', state: 'CA', zip: '95113' },
  ]

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Find Nearby ATM</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">
              Enter City or Zip Code:
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Jose, CA"
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
          >
            Search
          </button>
        </form>

        {searched && (
          <div className="space-y-3">
            <h3 className="font-semibold">Results:</h3>
            <ul className="space-y-2">
              {results.map((atm, idx) => (
                <li key={idx} className="island-shell rounded p-3">
                  {atm.address}, {atm.city}, {atm.state} {atm.zip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
