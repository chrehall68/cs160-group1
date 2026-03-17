import Account from '#/components/Account'
import Popup from '#/components/Popup'
import { clearAuthSession, isAuthenticated } from '@/lib/auth'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/accounts/$accountId')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AccountPage,
})

function AccountPage() {
  const router = useRouter()
  const { accountId } = Route.useParams()
  const [account, setAccount] = useState<AccountType | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  useEffect(() => {
    async function fetchAccount() {
      try {
        const response = await fetch(`/api/accounts/${accountId}`)
        if (response.ok) {
          const data = await response.json()
          setAccount(data)
        } else if (response.status === 401) {
          clearAuthSession()
          router.navigate({ to: '/login' })
        } else if (response.status === 403) {
          // not authorized
          router.navigate({ to: '/accounts' })
        } else if (response.status === 404) {
          // not found
          router.navigate({ to: '/accounts' })
        }
      } catch (error) {
        console.error('Error fetching account:', error)
      }
    }
    fetchAccount()
  }, [accountId, router])

  async function handleCloseAccount() {
    setIsClosing(true)
    setCloseError(null)

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthSession()
          router.navigate({ to: '/login' })
          return
        }

        throw new Error(data?.detail ?? 'Unable to close account.')
      }

      setShowPopup(false)
      router.navigate({ to: '/accounts' })
    } catch (error) {
      console.error('Error closing account:', error)
      setCloseError(
        error instanceof Error ? error.message : 'Unable to close account.',
      )
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {/* Popup  for closing account */}
      {showPopup && (
        <Popup
          title="Close this account?"
          description="Confirm that you want to close this account. The request will fail if the balance is not zero."
          onClose={() => setShowPopup(false)}
        >
          <div className="space-y-4">
            {closeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {closeError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="rounded border border-(--line) bg-white px-4 py-2 font-semibold text-[var(--sea-ink)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseAccount}
                disabled={isClosing}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isClosing ? 'Closing...' : 'Yes, Close Account'}
              </button>
            </div>
          </div>
        </Popup>
      )}

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Accounts</h2>
        </div>

        <h3 className="text-xl font-bold">Account {accountId}</h3>
        {account && (
          <Account account={account}>
            <button
              type="button"
              onClick={() => {
                setCloseError(null)
                setShowPopup(true)
              }}
              className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Close Account
            </button>
          </Account>
        )}
      </section>
      <section className="space-y-6">
        {/* TODO - recent transactions */}
      </section>
    </main>
  )
}
