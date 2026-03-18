export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '$0.00'
  }

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
  })
}

export function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
