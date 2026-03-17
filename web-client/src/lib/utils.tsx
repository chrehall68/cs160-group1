export function formatCurrency(value: number | string) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '$0.00'
  }

  // TODO - probably should allow other currencies
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
