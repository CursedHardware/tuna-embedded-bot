import Decimal from 'decimal.js'

interface ReadableNumberOptions {
  decimalPlaces?: number
  base?: number
  units?: string[]
}

export function toReadableNumber(input: Decimal.Value, options?: ReadableNumberOptions) {
  input = new Decimal(input)
  if (input.isZero()) return '0'
  if (input.lt('1')) return input.toFixed(3)
  const base = options?.base ?? 1000
  const units = options?.units ?? ['', 'k', 'M', 'G']
  // n = log(input) / log(base)
  const n = Decimal.log(input).divToInt(Decimal.log(base)).toNumber()
  // value = input / base ** n
  const value = input.div(Decimal.pow(base, n))
  const formatted = value.isInt() ? value.toFixed(options?.decimalPlaces ?? 1) : value.toString()
  return formatted + units[n]
}
