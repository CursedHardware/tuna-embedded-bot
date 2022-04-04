import Decimal from 'decimal.js'
import { toReadableNumber } from '../utils/number'
import type { Product, ProductPackage, ProductPrice } from './types'

const ONE = new Decimal('1')

export function getPackage({ amount, minUnit, unit }: ProductPackage) {
  return `${toReadableNumber(amount)} ${minUnit}/${unit}`
}

export function getReadablePrice(prices: Product['prices'], { minUnit }: Product['package']) {
  const toString = ({ start, price }: ProductPrice) => `${toReadableNumber(start)}+: ${formatPrice(price, minUnit)}`
  return {
    first: toString(prices[0]),
    last: toString(prices[prices.length - 1]),
    get start() {
      const { price, start } = prices[0]
      if (start < 2) return
      const minimumPrice = new Decimal(price).mul(start).toFixed(2)
      return `${minimumPrice}/${toReadableNumber(start)} ${minUnit}`
    },
  }
}

export function getReadableStock(stocks: Product['stocks'], { amount, minUnit, unit }: Product['package']) {
  const toString = (value: Decimal.Value) => {
    value = new Decimal(value)
    const pkg = `${toReadableNumber(value.div(amount))} ${unit}`
    return `${toReadableNumber(value)} ${minUnit} (${pkg})`
  }
  const inStocks = stocks.filter((stock) => stock.amount > 0)
  return {
    totalStocks: toString(Decimal.sum(...stocks.map((stock) => stock.amount))),
    stocks: inStocks.map(({ area, amount }) => ({ area, amount: toString(amount) })),
  }
}

export function formatPrice(input: Decimal.Value, unit: string) {
  input = new Decimal(input)
  if (input.lt(ONE)) return `1/${ONE.div(input).ceil()} ${unit}`
  return toReadableNumber(input)
}
