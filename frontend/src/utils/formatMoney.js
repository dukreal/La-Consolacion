// 1500 -> "1,500.00"
export function formatMoney(amount) {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// The 30% downpayment, rounded to centavos, as text ("450.00") because the server expects that format
export function downpaymentOf(total) {
  return total > 0 ? (total * 0.3).toFixed(2) : '0.00'
}
