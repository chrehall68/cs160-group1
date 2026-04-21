import { DecimalInput, IntegerInput } from '@/components/Inputs'
import { apiRequest, getErrorMessage, isApiError } from '@/lib/api'
import { isAdmin, isAuthenticated } from '@/lib/auth'
import { fetchAccounts, queryKeys } from '@/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

const UPLOAD_TOO_LARGE_MESSAGE = 'Upload too large. Please choose a smaller image.'

export const Route = createFileRoute('/deposit-check')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    if (isAdmin()) {
      throw redirect({ to: '/manager' })
    }
  },
  component: DepositCheck,
})

function DepositCheck() {
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [fromAccountNumber, setFromAccountNumber] = useState('')
  const [fromRoutingNumber, setFromRoutingNumber] = useState('')
  const [checkImage, setCheckImage] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })

  useEffect(() => {
    if (!selectedAccountId && accountsQuery.data?.length) {
      setSelectedAccountId(String(accountsQuery.data[0].account_id))
    }
  }, [accountsQuery.data, selectedAccountId])

  const depositMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest('/api/deposit/check', {
        method: 'POST',
        body: formData,
      }),
    onSuccess: async () => {
      setSuccess('Check deposit submitted successfully.')
      setAmount('')
      setFromAccountNumber('')
      setFromRoutingNumber('')
      setCheckImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.accountTransactions(selectedAccountId),
      })
    },
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    setSuccess('')

    const amountNum = Number(amount)
    if (!selectedAccountId || !amount || isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid account and amount.')
      return
    }
    if (!fromAccountNumber) {
      setFormError('Please enter the check account number.')
      return
    }
    if (!fromRoutingNumber) {
      setFormError('Please enter the check routing number.')
      return
    }
    if (!checkImage) {
      setFormError('Please upload a check image.')
      return
    }

    const formData = new FormData()
    formData.append('account_id', selectedAccountId)
    formData.append('check_amount', amount)
    formData.append('from_account_number', fromAccountNumber)
    formData.append('from_routing_number', fromRoutingNumber)
    formData.append('check_img', checkImage)

    try {
      await depositMutation.mutateAsync(formData)
    } catch {}
  }

  const mutationErrorMessage = depositMutation.isError
    ? isApiError(depositMutation.error) && depositMutation.error.status === 413
      ? UPLOAD_TOO_LARGE_MESSAGE
      : getErrorMessage(depositMutation.error, 'Check deposit failed.')
    : ''

  const error =
    formError ||
    (accountsQuery.isError &&
      getErrorMessage(accountsQuery.error, 'Could not load accounts.')) ||
    (!selectedAccountId && !accountsQuery.isLoading
      ? 'Please create an account before making a deposit.'
      : '') ||
    mutationErrorMessage ||
    ''

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-4 rounded-lg bg-(--surface-strong) p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold">Deposit Check</h2>

        <div>
          <label className="block text-sm font-medium">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 bg-(--surface-strong) text-(--sea-ink)"
            disabled={accountsQuery.isLoading || !accountsQuery.data?.length}
          >
            {accountsQuery.data?.map((account) => (
              <option
                key={account.account_id}
                value={account.account_id}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--sea-ink)',
                }}
              >
                {account.account_type} ••••{account.account_number.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Check Amount:</label>
          <DecimalInput val={amount} setVal={setAmount} required />
        </div>

        <div>
          <label className="block text-sm font-medium">
            From Account Number:
          </label>
          <IntegerInput
            val={fromAccountNumber}
            setVal={setFromAccountNumber}
            placeholder="Enter account number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            From Routing Number:
          </label>
          <IntegerInput
            val={fromRoutingNumber}
            setVal={setFromRoutingNumber}
            placeholder="Enter routing number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Check Image:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setCheckImage(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-(--lagoon) file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-(--lagoon-deep)"
            required
          />
        </div>

        <div className="border-t pt-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={depositMutation.isPending || accountsQuery.isLoading}
            className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-(--lagoon-deep) disabled:opacity-70"
          >
            {depositMutation.isPending ? 'Submitting...' : 'Deposit Check'}
          </button>
        </div>
      </form>
    </main>
  )
}
