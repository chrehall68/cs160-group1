import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clearAuthSession, isAuthenticated, useAuthSession } from '@/lib/auth'
import Popup from '@/components/Popup'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiRequest, getErrorMessage, isApiError } from '@/lib/api'
import { fetchCustomer, queryKeys } from '@/lib/queries'

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
  const queryClient = useQueryClient()
  const auth = useAuthSession()
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  
  // === NEW: Check if the current user is an admin ===
  const isAdminUser = auth.role === 'admin'

  const profileQuery = useQuery({
    queryKey: queryKeys.customer,
    queryFn: fetchCustomer,
    // === NEW: Only run this fetch if the user is NOT an admin ===
    enabled: !isAdminUser,
  })

  useEffect(() => {
    if (!isApiError(profileQuery.error) || profileQuery.error.status !== 401) {
      return
    }

    queryClient.clear()
    clearAuthSession()
    router.navigate({ to: '/login' })
  }, [profileQuery.error, queryClient, router])

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!auth.userId) {
        throw new Error(
          'Your session is missing a user id. Please sign in again.',
        )
      }

      return apiRequest(`/api/user/${auth.userId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.clear()
      clearAuthSession()
      setShowDeletePopup(false)
      router.navigate({ to: '/signup' })
    },
  })

  // === NEW: Show dummy data for Admin, otherwise show fetched data ===
  const firstName = isAdminUser ? 'System' : (profileQuery.data?.first_name ?? '')
  const lastName = isAdminUser ? 'Admin' : (profileQuery.data?.last_name ?? '')
  const email = isAdminUser ? 'admin@onlinebank.com' : (profileQuery.data?.email ?? '')
  const phone = isAdminUser ? 'N/A' : (profileQuery.data?.phone ?? '')
  
  const fullName = `${firstName} ${lastName}`.trim() || 'User'
  const initials =
    [firstName, lastName]
      .map((value) => value.trim().charAt(0))
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const handleDeleteUser = async () => {
    try {
      await deleteUserMutation.mutateAsync()
    } catch {}
  }

  const loadError =
    profileQuery.isError &&
    getErrorMessage(profileQuery.error, 'Unable to load your profile.')
  const deleteError =
    deleteUserMutation.isError &&
    getErrorMessage(deleteUserMutation.error, 'Unable to delete this user.')
  const isLoading = profileQuery.isLoading && !isAdminUser // Ensure admin isn't stuck loading
  const isDeleting = deleteUserMutation.isPending

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {showDeletePopup && (
        <Popup
          title="Delete this user?"
          description="Confirm that you want to delete this user account. This cannot be undone, and active accounts must be closed first. After deletion, the SSN on file cannot be used to register a new account."
          onClose={() => {
            deleteUserMutation.reset()
            setShowDeletePopup(false)
          }}
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
                onClick={() => {
                  deleteUserMutation.reset()
                  setShowDeletePopup(false)
                }}
                className="rounded border border-[var(--line)] bg-[var(--popup-bg)] px-4 py-2 font-semibold text-[var(--sea-ink)] hover:bg-black/5"
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--popup-bg)] text-xl font-bold text-[var(--sea-ink)]">
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
                rejected if you still have active accounts. After deletion, the
                SSN on file cannot be used to register a new account.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  deleteUserMutation.reset()
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