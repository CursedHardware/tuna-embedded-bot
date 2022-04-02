export function toReadableNumber(input: number, base = 1000) {
  if (input === 0) return '0'
  if (input < 1) return input.toFixed(3)
  const units = ['', 'k', 'M', 'G']
  const n = Math.floor(Math.log(input) / Math.log(base))
  const value = input / Math.pow(base, n)
  let formatted = value.toString()
  if (!Number.isInteger(value)) {
    formatted = value.toFixed(1)
  }
  return formatted + units[n]
}

export function formatPrice(input: number) {
  if (input < 100) return input
  if (input < 1000) return input.toFixed(2)
  return toReadableNumber(input)
}
