import { formatCurrency, toTitleCase } from '@/lib/utils'
import clsx from 'clsx'

export default function Account({
  account,
  className,
  children,
  ...props
}: {
  account: AccountType
  className?: string
  children?: React.ReactNode
  [key: string]: any
}) {
  return (
    <div
      key={account.account_id}
      className={clsx('rounded-lg bg-[var(--surface-strong)] p-6 shadow-md', className)}
      {...props}
    >
      <div className="flex flex-col justify-between">
        <div className="flex flex-row items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              {toTitleCase(account.account_type)} Account
            </h3>
            <p className="mt-1 text-sm text-(--sea-ink-soft)">
              Account Number: {account.account_number}
            </p>
            <p className="mt-1 text-sm text-(--sea-ink-soft)">
              Routing Number: {account.routing_number}
            </p>
          </div>

          {children}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-[var(--surface)] p-4">
          <p className="text-sm text-(--sea-ink-soft)">Available Balance</p>
          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(account.balance)}
          </p>
        </div>
        <div className="rounded-md bg-[var(--surface)] p-4">
          <p className="text-sm text-(--sea-ink-soft)">Account Type</p>
          <p className="mt-1 text-xl font-semibold">
            {toTitleCase(account.account_type)}
          </p>
        </div>
      </div>
    </div>
  )
}
