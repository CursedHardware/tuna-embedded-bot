import { Decimal } from 'decimal.js'

const ONE = new Decimal('1')

export function toReadableNumber(input: Decimal.Value, base = 1000) {
  input = new Decimal(input)
  if (input.isZero()) return '0'
  if (input.lt('1')) return input.toFixed(3)
  const units = ['', 'k', 'M', 'G']
  // n = log(input) / log(base)
  const n = Decimal.log(input).divToInt(Decimal.log(base)).toNumber()
  // value = input / base ** n
  const value = input.div(Decimal.pow(base, n))
  let formatted = value.toString()
  if (!value.isInt()) {
    formatted = value.toFixed(1)
  }
  return formatted + units[n]
}

export function formatPrice(input: Decimal.Value, unit: string) {
  input = new Decimal(input)
  if (input.lt(ONE)) return `${ONE.div(input).ceil()} ${unit}/1`
  return toReadableNumber(input)
}
