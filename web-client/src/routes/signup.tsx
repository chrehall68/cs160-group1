import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiRequest, getErrorMessage } from '../lib/api'
import { isAuthenticated, setAuthSession } from '../lib/auth'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/accounts' })
    }
  },
  component: SignUp,
})

interface SignupResponse {
  access_token: string
  role: 'user' | 'admin'
  user_id: number
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

function SignUp() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [ssn, setSSN] = useState('')
  const [street, setStreet] = useState('')
  const [unit, setUnit] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('USA')

  const [error, setError] = useState<string | null>(null)
  const signupMutation = useMutation({
    mutationFn: () =>
      apiRequest<SignupResponse>('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          email,
          phone: phoneNumber,
          ssn,
          address: {
            street,
            unit,
            city,
            state,
            zipcode: zipCode,
            country,
          },
        }),
      }),
    onSuccess: (data) => {
      if (!data.access_token || !data.user_id) {
        throw new Error('Account created but auth session could not be created')
      }

      queryClient.clear()
      setAuthSession(data.access_token, data.role, data.user_id)
      router.navigate({ to: '/accounts' })
    },
  })

  // scroll to top when there's an error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [error])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // some basic client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await signupMutation.mutateAsync()
    } catch (mutationError) {
      setError(
        getErrorMessage(
          mutationError,
          'Failed to create account. Please try again.',
        ),
      )
    }
  }

  const isSubmitting = signupMutation.isPending

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
              placeholder="Choose a password"
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

        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>

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
              onChange={(e) =>
                setPhoneNumber(digitsOnly(e.target.value).slice(0, 10))
              }
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="1234567890"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">SSN</label>
            <input
              type="text"
              value={ssn}
              onChange={(e) => setSSN(digitsOnly(e.target.value).slice(0, 9))}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="123456789"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={9}
              required
            />
          </div>
        </div>

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
                onChange={(e) =>
                  setZipCode(digitsOnly(e.target.value).slice(0, 5))
                }
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Zip code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
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

        <div className="border-t pt-6 space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-[var(--lagoon)] px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[var(--lagoon)] hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </main>
  )
}
