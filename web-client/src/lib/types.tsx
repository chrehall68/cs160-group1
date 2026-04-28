type AccountType = {
  account_id: number
  account_number: string
  routing_number: string
  account_type: string
  status: string
  balance: number
  currency: string
  created_at: string // timestamp string
}
type TransactionType = {
  transaction_id: number
  ledger_type: 'debit' | 'credit'
  transaction_type: 'atm_deposit' | 'online_deposit' | 'withdrawal' | 'transfer'
  status: 'pending' | 'completed' | 'failed'
  description: string
  amount: number
  currency: string
  created_at: string // timestamp string
}

type TransactionDetail = {
  transaction: {
    transaction_id: number
    transaction_type: string
    amount: number
    currency: string
    status: string
    description: string
    created_at: string
  }
  atm_deposit?: {
    deposit_id: number
    transaction_id: number
    atm_id: number
    type: string
  }
  atm_address?: string | null
  online_deposit?: {
    deposit_id: number
    transaction_id: number
    check_image_name: string
    check_from_routing_number: string
    check_from_account_number: string
  }
  check_image_url?: string
  withdrawal?: {
    withdraw_id: number
    transaction_id: number
    atm_id: number
  }
  transfer?: {
    transfer_id: number
    transaction_id: number
    from_routing_number: string
    from_account_number: string
    to_routing_number: string
    to_account_number: string
  }
}

type RecurringFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly'

type RecurringPaymentType = {
  recurring_payment_id: number
  from_account_id: number
  payee_account_number: string
  payee_routing_number: string
  amount: string
  currency: string
  frequency: RecurringFrequency
  next_payment_date: string
  created_at: string
  canceled_at: string | null
  completed_at: string | null
  status: 'active' | 'canceled' | 'completed'
}
