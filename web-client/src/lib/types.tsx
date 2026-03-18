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
  type: 'debit' | 'credit'
  amount: number
  currency: string
  created_at: string // timestamp string
}
