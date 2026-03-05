import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/signup')({
  component: SignUp,
})

function SignUp() {
  const router = useRouter()

  // User fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Customer fields
  const [customerType, setCustomerType] = useState('individual')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [ssn, setSSN] = useState('')

  // Address fields
  const [street, setStreet] = useState('')
  const [unit, setUnit] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('USA')

  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // TODO - Send signup request to backend
    // For now, navigate to dashboard
    router.navigate({ to: '/dashboard' })
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl space-y-6 rounded-lg bg-white/80 p-8 shadow-lg backdrop-blur"
      >
        <h2 className="text-2xl font-bold">Create Account</h2>

        {error && (
          <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        {/* Login Credentials Section */}
        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Login Information</h3>

          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>

          <div>
            <label className="block text-sm font-medium">Account Type</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="First name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="(123) 456-7890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">SSN</label>
            <input
              type="text"
              value={ssn}
              onChange={(e) => setSSN(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="XXX-XX-XXXX"
              maxLength={11}
              required
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Address</h3>

          <div>
            <label className="block text-sm font-medium">Street</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Street address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Unit (Optional)</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Apt, Suite, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="City"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="State"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Zip Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Zip code"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Country"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit and Link Section */}
        <div className="border-t pt-6 space-y-4">
          <button
            type="submit"
            className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
          >
            Create Account
          </button>

          <p className="text-center text-sm">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-[var(--lagoon)] hover:underline font-semibold"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </main>
  )
}
