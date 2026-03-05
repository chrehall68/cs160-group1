import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/accounts')({
  component: Accounts,
})

interface Transaction {
  id: number
  amount: number
  description: string
  date: string
}

function Accounts() {
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)

  const checkingTransactions: Transaction[] = [
    {
      id: 1,
      amount: 30,
      description: 'Cash Deposit',
      date: '2024-03-03',
    },
    {
      id: 2,
      amount: -300,
      description: 'Transfer to account ••••2245',
      date: '2024-03-02',
    },
    {
      id: 4,
      amount: 500,
      description: 'Check Deposit',
      date: '2024-02-28',
    },
    {
      id: 5,
      amount: -75,
      description: 'ATM Withdrawal',
      date: '2024-02-27',
    },
  ]

  const savingsTransactions: Transaction[] = [
    {
      id: 1,
      amount: 250,
      description: 'Transfer from Checking',
      date: '2024-03-03',
    },
    {
      id: 2,
      amount: 10.5,
      description: 'Interest Payment',
      date: '2024-02-28',
    },
    {
      id: 3,
      amount: -150,
      description: 'Transfer to Checking',
      date: '2024-02-25',
    },
    {
      id: 4,
      amount: 100,
      description: 'Transfer from Checking',
      date: '2024-02-20',
    },
    {
      id: 5,
      amount: 8.75,
      description: 'Interest Payment',
      date: '2024-01-28',
    },
  ]

  const toggleAccount = (accountName: string) => {
    setExpandedAccount(expandedAccount === accountName ? null : accountName)
  }

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : ''
    const color = amount >= 0 ? 'text-green-600' : 'text-red-600'
    return { sign, color, value: Math.abs(amount).toFixed(2) }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Your Accounts</h2>

        {/* Checking Account */}
        <div
          onClick={() => toggleAccount('checking')}
          className="cursor-pointer rounded-lg bg-white/80 p-6 shadow-md transition hover:shadow-lg"
        >
          <h3 className="font-semibold">Checking Account</h3>
          <p>Account Number: ••••1234</p>
          <p>Balance: $2,100.20</p>
          <p>Status: Active</p>
          <p className="mt-2 text-sm text-gray-600">
            {expandedAccount === 'checking'
              ? '▼ Hide transactions'
              : '▶ Show recent transactions'}
          </p>

          {expandedAccount === 'checking' && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700">
                Recent Transactions
              </p>
              {checkingTransactions.map((transaction) => {
                const { sign, color, value } = formatAmount(transaction.amount)
                return (
                  <div
                    key={transaction.id}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <p>{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.date}
                      </p>
                    </div>
                    <p className={`font-semibold ${color}`}>
                      {sign}${value}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Savings Account */}
        <div
          onClick={() => toggleAccount('savings')}
          className="cursor-pointer rounded-lg bg-white/80 p-6 shadow-md transition hover:shadow-lg"
        >
          <h3 className="font-semibold">Savings Account</h3>
          <p>Account Number: ••••8832</p>
          <p>Balance: $2,130.34</p>
          <p>Status: Active</p>
          <p className="mt-2 text-sm text-gray-600">
            {expandedAccount === 'savings'
              ? '▼ Hide transactions'
              : '▶ Show recent transactions'}
          </p>

          {expandedAccount === 'savings' && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700">
                Recent Transactions
              </p>
              {savingsTransactions.map((transaction) => {
                const { sign, color, value } = formatAmount(transaction.amount)
                return (
                  <div
                    key={transaction.id}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <p>{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.date}
                      </p>
                    </div>
                    <p className={`font-semibold ${color}`}>
                      {sign}${value}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
