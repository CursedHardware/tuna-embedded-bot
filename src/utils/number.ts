import Decimal from 'decimal.js'

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
