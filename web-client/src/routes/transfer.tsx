import { DecimalInput, IntegerInput } from '#/components/Inputs'
import { apiRequest, getErrorMessage } from '#/lib/api'
import { fetchAccounts, queryKeys } from '#/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import type { PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link'
import { usePlaidLink } from 'react-plaid-link'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/transfer')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Transfer,
})

function InternalTransfer() {
  // form data state
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [startDate, setStartDate] = useState('')
  // display state
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const queryClient = useQueryClient()
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })

  // display initial data
  useEffect(() => {
    if (!selectedAccountId && accountsQuery.data?.length) {
      setSelectedAccountId(String(accountsQuery.data[0].account_id))
    }
  }, [accountsQuery.data, selectedAccountId])

  // handlers for transfers
  const onSuccess = async (msg: string) => {
    setSuccess(msg)
    // clear form data
    setToAccount('')
    setRoutingNumber('')
    setAmount('')
    setFrequency('')
    setStartDate('')
    setIsRecurring(false)
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    await queryClient.invalidateQueries({
      queryKey: queryKeys.accountTransactions(selectedAccountId),
    })
  }

  const transferMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/transfer/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_account_id: Number(selectedAccountId),
          to_account_number: toAccount,
          to_routing_number: routingNumber,
          amount,
        }),
      }),
    onSuccess: async () => onSuccess('Transfer succeeded'),
  })
  const recurringTransferMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_account_id: Number(selectedAccountId),
          payee_account_number: toAccount,
          payee_routing_number: routingNumber,
          amount,
          frequency,
          next_payment_date: startDate,
        }),
      }),
    onSuccess: async () => onSuccess('Scheduled transfer'),
  })
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    setFormError('')
    setSuccess('')

    if (!selectedAccountId) {
      setFormError('Please enter a valid account.')
      return
    }
    if (isRecurring) {
      await recurringTransferMutation.mutateAsync()
    } else {
      await transferMutation.mutateAsync()
    }
  }
  // display state logic
  const error =
    formError ||
    (accountsQuery.isError &&
      getErrorMessage(accountsQuery.error, 'Could not load accounts.')) ||
    (!selectedAccountId && !accountsQuery.isLoading
      ? 'Please create an account before making a deposit.'
      : '') ||
    (transferMutation.isError &&
      getErrorMessage(transferMutation.error, 'Transfer failed.')) ||
    (recurringTransferMutation.isError &&
      getErrorMessage(recurringTransferMutation.error, 'Transfer failed.')) ||
    ''

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Internal Transfer</h3>
      <p>Transfer from an internal account</p>
      <div>
        <label className="block text-sm font-medium">Account:</label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          disabled={accountsQuery.isLoading || !accountsQuery.data?.length}
        >
          {accountsQuery.data?.map((account) => (
            <option key={account.account_id} value={account.account_id}>
              {account.account_type} ••••{account.account_number.slice(-4)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">To Account Number:</label>
        <IntegerInput
          val={toAccount}
          setVal={setToAccount}
          placeholder="Enter account number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Routing Number:</label>
        <IntegerInput
          val={routingNumber}
          setVal={setRoutingNumber}
          placeholder="Enter routing number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Amount:</label>
        <DecimalInput val={amount} setVal={setAmount} required />
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="ml-2 text-sm font-medium">Schedule for later</span>
        </label>
      </div>

      {isRecurring && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div>
            <label className="block text-sm font-medium">Frequency:</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="once">Once</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required={isRecurring}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
      >
        Submit Transfer
      </button>
    </form>
  )
}

function Linker({ token }: { token: string }) {
  const onSuccess: PlaidLinkOnSuccess = (publicToken, metadata) => {
    console.log('publicToken', publicToken)
    console.log('metadata', metadata)
  }

  const plaidConfig: PlaidLinkOptions = {
    onSuccess,
    onExit: () => {
      console.log('exit')
    },
    token,
  }

  const { open, exit, ready } = usePlaidLink(plaidConfig)
  useEffect(() => {
    if (ready) {
      open()
    }
  })

  return <></>
}
function ExternalTransfer() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
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

  console.log('linkToken', linkToken)

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-bold">External Transfer</h3>
      <p>Transfer from an external account</p>

      <div>
        <label className="block text-sm font-medium">
          Destination Account:
        </label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          disabled={accountsQuery.isLoading || !accountsQuery.data?.length}
        >
          {accountsQuery.data?.map((account) => (
            <option key={account.account_id} value={account.account_id}>
              {account.account_type} ••••{account.account_number.slice(-4)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Amount:</label>
        <DecimalInput val={amount} setVal={setAmount} required />
      </div>

      <button
        className="w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]"
        onClick={async () => {
          const data: any = await apiRequest('/api/external/initiate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount,
              account_id: Number(selectedAccountId),
            }),
          })
          setLinkToken(data.link_token)
        }}
      >
        Begin External Transfer
      </button>

      <Linker token={linkToken || ''} />
    </div>
  )
}
function Transfer() {
  const [internal, setInternal] = useState(true)
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className="mx-auto max-w-lg space-y-4 rounded-lg bg-white/80 p-6 shadow-lg">
        <h2 className="text-2xl font-bold">Transfer Money</h2>
        <div className="flex flex-row w-full justify-start text-sm font-medium items-center">
          <p className="pr-2">Transfer Type:</p>
          <button
            className={clsx(
              'p-2 border-l-2 border-t-2 border-b-2 hover:bg-gray-200 active:bg-gray-300 hover:cursor-pointer',
              internal && 'bg-gray-300',
            )}
            onClick={() => setInternal(true)}
          >
            Internal Transfer
          </button>
          <button
            className={clsx(
              'p-2 border-2 hover:bg-gray-200 active:bg-gray-300 hover:cursor-pointer',
              !internal && 'bg-gray-300',
            )}
            onClick={() => setInternal(false)}
          >
            External Transfer
          </button>
        </div>
        {internal ? <InternalTransfer /> : <ExternalTransfer />}
      </div>
    </main>
  )
}
