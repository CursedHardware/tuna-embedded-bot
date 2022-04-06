import Decimal from 'decimal.js'
import { toReadableNumber } from '../utils/number'

const ONE = new Decimal('1')

export function formatPrice(input: Decimal.Value, unit: string) {
  input = new Decimal(input)
  if (input.lt(ONE)) return `1/${ONE.div(input).ceil()} ${unit}`
  return toReadableNumber(input)
}
