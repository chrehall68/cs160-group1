import { clearAuthSession, isAuthenticated, useAuthSession } from '#/lib/auth'
import Popup from '#/components/Popup'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const auth = useAuthSession()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)

  const fullName = `${firstName} ${lastName}`.trim() || 'User'
  const initials =
    [firstName, lastName]
      .map((value) => value.trim().charAt(0))
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetch('/api/customer')
        if (!response.ok) {
          const data = await response.json().catch(() => null)

          if (response.status === 401) {
            clearAuthSession()
            router.navigate({ to: '/login' })
            return
          }

          throw new Error(data?.detail ?? 'Unable to load your profile.')
        }

        const data = (await response.json()) as {
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
        }

        if (!isMounted) {
          return
        }

        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.error('Error fetching user info:', error)
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load your profile.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleDeleteUser = async () => {
    if (!auth.userId) {
      setDeleteError('Your session is missing a user id. Please sign in again.')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/user/${auth.userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail ?? 'Unable to delete this user.')
      }

      clearAuthSession()
      setShowDeletePopup(false)
      router.navigate({ to: '/signup' })
    } catch (error) {
      console.error('Error deleting user:', error)
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete this user.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {showDeletePopup && (
        <Popup
          title="Delete this user?"
          description="Confirm that you want to delete this user account. This cannot be undone, and active accounts must be closed first."
          onClose={() => setShowDeletePopup(false)}
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeletePopup(false)}
                className="rounded border border-[var(--line)] bg-white px-4 py-2 font-semibold text-[var(--sea-ink)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? 'Deleting user...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </Popup>
      )}

      <section className="space-y-6">
        <div className="island-shell rise-in rounded-2xl p-6 sm:p-8">
          <p className="island-kicker mb-2">Profile</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--line)] bg-white/80 text-xl font-bold text-[var(--sea-ink)]">
                {initials}
              </div>
              <div>
                <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
                  {isLoading ? 'Loading profile...' : fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--sea-ink-soft)]">
                  Review your personal details
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="feature-card rounded-2xl border border-[var(--line)] p-6">
            <h2 className="text-xl font-bold text-[var(--sea-ink)]">
              User Information
            </h2>

            {loadError ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {loadError}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <article className="island-shell rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kicker)]">
                    First Name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--sea-ink)]">
                    {isLoading ? 'Loading...' : firstName || 'Not provided'}
                  </p>
                </article>

                <article className="island-shell rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kicker)]">
                    Last Name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--sea-ink)]">
                    {isLoading ? 'Loading...' : lastName || 'Not provided'}
                  </p>
                </article>
                <article className="island-shell rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kicker)]">
                    Email
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--sea-ink)]">
                    {isLoading ? 'Loading...' : email || 'Not provided'}
                  </p>
                </article>
                <article className="island-shell rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kicker)]">
                    Phone
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--sea-ink)]">
                    {isLoading ? 'Loading...' : phone || 'Not provided'}
                  </p>
                </article>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <article className="feature-card rounded-2xl border border-[var(--line)] p-6">
              <p className="island-kicker mb-2">Account Action</p>
              <h2 className="text-xl font-bold text-[var(--sea-ink)]">
                Delete User
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--sea-ink-soft)]">
                This permanently removes your user account. The request will be
                rejected if you still have active accounts.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setShowDeletePopup(true)
                }}
                disabled={isDeleting}
                className="mt-5 w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Delete User
              </button>
            </article>
          </section>
        </div>
      </section>
    </main>
  )
}
