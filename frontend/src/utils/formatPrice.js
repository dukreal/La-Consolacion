// 1500 -> "1,500.00" (the same format PHP's number_format($price, 2) gave)
export function formatPrice(price) {
  return Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
