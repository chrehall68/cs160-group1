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
