import { DecimalInput, IntegerInput } from '@/components/Inputs'
import { apiRequest, getErrorMessage } from '@/lib/api'
import { isAdmin, isAuthenticated } from '@/lib/auth'
import { fetchAccounts, queryKeys } from '@/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import type { PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link'
import { usePlaidLink } from 'react-plaid-link'

export const Route = createFileRoute('/transfer')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    if (isAdmin()) {
      throw redirect({ to: '/manager' })
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
    setFrequency('weekly')
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
          className="mt-1 w-full rounded border px-3 py-2 bg-[var(--surface-strong)] text-[var(--sea-ink)]"
          disabled={accountsQuery.isLoading || !accountsQuery.data?.length}
        >
          {accountsQuery.data?.map((account) => (
            <option
              key={account.account_id}
              value={account.account_id}
              style={{ background: 'var(--surface)', color: 'var(--sea-ink)' }}
            >
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
        <div className="space-y-4 rounded-lg bg-[var(--schedule-bg)] p-4">
          <div>
            <label className="block text-sm font-medium">Frequency:</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 bg-[var(--surface-strong)] text-[var(--sea-ink)]"
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

type InitiatedExternalTransferResponse = {
  link_token: string
  transfer_intent_id: string
}
function ExternalTransfer() {
  // state
  const [response, setResponse] =
    useState<InitiatedExternalTransferResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  // display state
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  // queries
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
  })
  useEffect(() => {
    if (!selectedAccountId && accountsQuery.data?.length) {
      setSelectedAccountId(String(accountsQuery.data[0].account_id))
    }
  }, [accountsQuery.data, selectedAccountId])

  const onSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
    try {
      const data: any = await apiRequest('/api/transfer/external/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transfer_intent_id: response?.transfer_intent_id,
          public_token: publicToken,
        }),
      })

      setSuccess(data.message)
      // clear form data
      setAmount('')
    } catch (error) {
      setFormError(getErrorMessage(error, 'Error completing transfer'))
    }

    setResponse(null)
    setLoading(false)
  }

  const plaidConfig: PlaidLinkOptions = {
    onSuccess,
    onExit: () => {
      setLoading(false)
      setResponse(null)
    },
    token: response?.link_token || '',
  }

  const { open, ready } = usePlaidLink(plaidConfig)
  useEffect(() => {
    if (ready && response?.link_token && loading) {
      open()
    }
  }, [ready, response?.link_token, loading, open])

  const initiateTransfer = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    setSuccess('')
    if (!selectedAccountId) {
      setFormError('Please select an account.')
      setLoading(false)
      return
    }
    if (!response) {
      try {
        const data: any = await apiRequest('/api/transfer/external/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            account_id: Number(selectedAccountId),
          }),
        })
        setResponse(data)
      } catch (error) {
        setFormError(getErrorMessage(error, 'Error initiating transfer'))
        setLoading(false)
      }
    }
  }

  const error =
    formError ||
    (accountsQuery.isError &&
      getErrorMessage(accountsQuery.error, 'Could not load accounts.')) ||
    (!selectedAccountId && !accountsQuery.isLoading
      ? 'Please create an account before making a deposit.'
      : '') ||
    ''

  return (
    <form className="flex flex-col space-y-4" onSubmit={initiateTransfer}>
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
          required
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        className={clsx(
          'w-full rounded bg-(--lagoon) px-4 py-2 font-semibold text-white hover:bg-[var(--lagoon-deep)]',
          loading && 'opacity-50 cursor-wait',
        )}
        type="submit"
        disabled={loading}
      >
        Begin External Transfer
      </button>
    </form>
  )
}
function Transfer() {
  const [internal, setInternal] = useState(true)
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className="mx-auto max-w-lg space-y-4 rounded-lg bg-[var(--surface-strong)] p-6 shadow-lg">
        <h2 className="text-2xl font-bold">Transfer Money</h2>
        <div className="flex flex-row w-full justify-start text-sm font-medium items-center">
          <p className="pr-2">Transfer Type:</p>
          <button
            className={clsx(
              'p-2 border-l-2 border-t-2 border-b-2 hover:bg-[var(--transfer-hover)] active:bg-gray-300 hover:cursor-pointer',
              internal && 'bg-[var(--transfer-active)]',
            )}
            onClick={() => setInternal(true)}
          >
            Internal Transfer
          </button>
          <button
            className={clsx(
              'p-2 border-2 hover:bg-[var(--transfer-hover)] active:bg-gray-300 hover:cursor-pointer',
              !internal && 'bg-[var(--transfer-active)]',
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
