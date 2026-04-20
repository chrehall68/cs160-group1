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
    direction: string
  }
}
