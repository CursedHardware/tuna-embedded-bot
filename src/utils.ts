import urlcat from 'urlcat'

export function getLuckyURL(query: string) {
  return urlcat('https://duckduckgo.com', { q: `! ${query}` })
}

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
  if (input < 3) return input.toFixed(6)
  if (input < 1000) return input.toFixed(2)
  return `${(input / 1000).toFixed(1)}k`
}
