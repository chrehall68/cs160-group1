import Account from '@/components/Account'
import Popup from '@/components/Popup'
import { apiRequest, getErrorMessage, isApiError } from '@/lib/api'
import { clearAuthSession, isAuthenticated } from '@/lib/auth'
import {
  fetchAccount,
  fetchTransactionDetail,
  fetchTransactions,
  queryKeys,
} from '@/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const transactionTypeLabels: Record<
  TransactionType['transaction_type'],
  string
> = {
  atm_deposit: 'ATM Deposit',
  online_deposit: 'Online Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
}

function TransactionDetailPopup({
  accountId,
  transactionId,
  onClose,
}: {
  accountId: string
  transactionId: number
  onClose: () => void
}) {
  const detailQuery = useQuery({
    queryKey: queryKeys.transactionDetail(accountId, transactionId),
    queryFn: () => fetchTransactionDetail(accountId, transactionId),
  })

  const detail = detailQuery.data
  const txn = detail?.transaction

  return (
    <Popup
      title="Transaction Details"
      description={
        txn
          ? `${transactionTypeLabels[txn.transaction_type as TransactionType['transaction_type']]} — ${'$' + txn.amount}`
          : 'Loading...'
      }
      onClose={onClose}
    >
      {detailQuery.isLoading && (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading details...</p>
      )}
      {detailQuery.isError && (
        <p className="text-sm text-red-600">
          {getErrorMessage(detailQuery.error, 'Unable to load details.')}
        </p>
      )}
      {detail && (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--sea-ink-soft)]">Status</span>
            <span className="font-medium">{txn?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--sea-ink-soft)]">Date</span>
            <span className="font-medium">{txn?.created_at}</span>
          </div>
          {txn?.description && (
            <div className="flex justify-between">
              <span className="text-[var(--sea-ink-soft)]">Description</span>
              <span className="font-medium">{txn.description}</span>
            </div>
          )}

          {/* ATM Deposit details */}
          {detail.atm_deposit && (
            <>
              <hr className="border-[var(--line)]" />
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">Deposit Type</span>
                <span className="font-medium capitalize">
                  {detail.atm_deposit.type}
                </span>
              </div>
              {detail.atm_address && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--sea-ink-soft)] shrink-0">
                    ATM Location
                  </span>
                  <span className="font-medium text-right">
                    {detail.atm_address}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Online Deposit details */}
          {detail.online_deposit && (
            <>
              <hr className="border-[var(--line)]" />
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">
                  From Routing #
                </span>
                <span className="font-medium">
                  {detail.online_deposit.check_from_routing_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">
                  From Account #
                </span>
                <span className="font-medium">
                  {detail.online_deposit.check_from_account_number}
                </span>
              </div>
              {detail.check_image_url && (
                <div className="mt-2">
                  <p className="text-[var(--sea-ink-soft)] mb-2">Check Image</p>
                  <img
                    src={detail.check_image_url}
                    alt="Deposited check"
                    className="w-full rounded border border-[var(--line)]"
                  />
                </div>
              )}
            </>
          )}

          {/* Withdrawal details */}
          {detail.withdrawal && detail.atm_address && (
            <>
              <hr className="border-[var(--line)]" />
              <div className="flex justify-between gap-4">
                <span className="text-[var(--sea-ink-soft)] shrink-0">
                  ATM Location
                </span>
                <span className="font-medium text-right">
                  {detail.atm_address}
                </span>
              </div>
            </>
          )}

          {/* Transfer details */}
          {detail.transfer && (
            <>
              <hr className="border-[var(--line)]" />
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">
                  From Routing #
                </span>
                <span className="font-medium">
                  {detail.transfer.from_routing_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">
                  From Account #
                </span>
                <span className="font-medium">
                  {detail.transfer.from_account_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">To Routing #</span>
                <span className="font-medium">
                  {detail.transfer.to_routing_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--sea-ink-soft)]">To Account #</span>
                <span className="font-medium">
                  {detail.transfer.to_account_number}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Popup>
  )
}

function Transaction({
  transaction,
  onSelect,
}: {
  transaction: TransactionType
  onSelect: (id: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(transaction.transaction_id)}
      className="w-full text-left flex flex-row justify-between items-center rounded-lg bg-[var(--surface-strong)] p-6 shadow-md hover:bg-[var(--surface-strong)]/80 transition-colors cursor-pointer"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-(--sea-ink)">
          {transactionTypeLabels[transaction.transaction_type]}
        </p>
        {transaction.ledger_type == 'credit' ? (
          <p className="text-green-700">+{'$' + transaction.amount}</p>
        ) : (
          <p className="text-red-700">-{'$' + transaction.amount}</p>
        )}
      </div>
      <p className="text-sm text-[var(--sea-ink-soft)]">
        Created at {transaction.created_at}
      </p>
    </button>
  )
}
function Transactions({ accountId }: { accountId: string }) {
  const [page, setPage] = useState<number>(1)
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null)
  const limit = 10
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions(accountId, page, limit),
    queryFn: () => fetchTransactions(accountId, page, limit),
  })

  useEffect(() => {
    setPage(1)
  }, [accountId])

  const transactions = transactionsQuery.data?.transactions ?? []
  const numPages = transactionsQuery.data?.total_pages ?? 1

  return (
    <div className="flex flex-col space-y-4">
      {selectedTransactionId !== null && (
        <TransactionDetailPopup
          accountId={accountId}
          transactionId={selectedTransactionId}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}

      {transactionsQuery.isLoading ? (
        <p>Loading transactions...</p>
      ) : transactionsQuery.isError ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(
            transactionsQuery.error,
            'Unable to load transactions.',
          )}
        </p>
      ) : transactions.length === 0 ? (
        <p>No transactions.</p>
      ) : (
        transactions.map((transaction) => (
          <Transaction
            key={transaction.transaction_id}
            transaction={transaction}
            onSelect={setSelectedTransactionId}
          />
        ))
      )}

      {numPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || transactionsQuery.isFetching}
            className="rounded border border-(--line) bg-(--surface-strong) px-3 py-2 text-sm font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <p className="text-sm text-(--sea-ink-soft)">
            Page {page} of {numPages}
          </p>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(numPages, current + 1))
            }
            disabled={page === numPages || transactionsQuery.isFetching}
            className="rounded border border-(--line) bg-(--surface-strong) px-3 py-2 text-sm font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function AccountPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accountId } = Route.useParams()
  const [showPopup, setShowPopup] = useState(false)
  const accountQuery = useQuery({
    queryKey: queryKeys.account(accountId),
    queryFn: () => fetchAccount(accountId),
  })

  useEffect(() => {
    if (!isApiError(accountQuery.error)) {
      return
    }

    if (accountQuery.error.status === 401) {
      queryClient.clear()
      clearAuthSession()
      router.navigate({ to: '/login' })
      return
    }

    if (
      accountQuery.error.status === 403 ||
      accountQuery.error.status === 404
    ) {
      router.navigate({ to: '/accounts' })
    }
  }, [accountQuery.error, queryClient, router])

  const closeAccountMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      setShowPopup(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.transactionsRoot,
      })
      router.navigate({ to: '/accounts' })
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 401) {
        queryClient.clear()
        clearAuthSession()
        router.navigate({ to: '/login' })
      }
    },
  })

  async function handleCloseAccount() {
    try {
      await closeAccountMutation.mutateAsync()
    } catch {}
  }

  const closeError = closeAccountMutation.isError
    ? getErrorMessage(closeAccountMutation.error, 'Unable to close account.')
    : null

  // ===== display =====
  return (
    <main className="page-wrap px-4 pb-8 pt-14 space-y-6">
      {/* Popup  for closing account */}
      {showPopup && (
        <Popup
          title="Close this account?"
          description="Confirm that you want to close this account. The request will fail if the balance is not zero."
          onClose={() => {
            closeAccountMutation.reset()
            setShowPopup(false)
          }}
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
                onClick={() => {
                  closeAccountMutation.reset()
                  setShowPopup(false)
                }}
                className="rounded border border-(--line) bg-[var(--popup-bg)] px-4 py-2 font-semibold text-[var(--sea-ink)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseAccount}
                disabled={closeAccountMutation.isPending}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {closeAccountMutation.isPending
                  ? 'Closing...'
                  : 'Yes, Close Account'}
              </button>
            </div>
          </div>
        </Popup>
      )}

      {/* Main display */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Accounts</h2>
        </div>

        <h3 className="text-xl font-bold">Account {accountId}</h3>
        {accountQuery.isLoading && (
          <div className="rounded-lg bg-[var(--surface-strong)] p-6 shadow-md">
            <p className="text-[var(--sea-ink-soft)]">Loading account...</p>
          </div>
        )}
        {accountQuery.isError && !isApiError(accountQuery.error) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {getErrorMessage(accountQuery.error, 'Unable to load account.')}
          </div>
        )}
        {accountQuery.data && (
          <Account account={accountQuery.data}>
            <button
              type="button"
              onClick={() => {
                closeAccountMutation.reset()
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
        <h3 className="text-xl font-bold">Recent Transactions</h3>
        <Transactions accountId={accountId} />
      </section>
    </main>
  )
}
