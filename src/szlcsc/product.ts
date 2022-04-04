import Decimal from 'decimal.js'
import { formatPrice, toReadableNumber } from '../utils/number'
import type { Product, ProductPackage } from './types'

export function makeStartPrice(prices: Product['prices'], { minUnit }: ProductPackage) {
  const { price, start } = prices[0]
  const minimumPrice = new Decimal(price).mul(start).toFixed(2)
  return `${toReadableNumber(start)} ${minUnit}/${minimumPrice}`
}

export function makePriceList(prices: Product['prices'], { minUnit }: Product['package']): string {
  return [prices[0], prices[prices.length - 1]]
    .map(({ start, price }) => `${toReadableNumber(start)}+: ${formatPrice(price, minUnit)}`)
    .join(', ')
}

export function getPackage({ amount, minUnit, unit }: ProductPackage) {
  return `${toReadableNumber(amount)} ${minUnit}/${unit}`
}

export function getInStock({ amount, minUnit, unit }: ProductPackage, stock: Decimal.Value) {
  stock = new Decimal(stock)
  if (stock.isZero()) return 'Out of Stock'
  const packet = `${toReadableNumber(stock.div(amount))} ${unit}`
  return `${toReadableNumber(stock)} ${minUnit} (${packet})`
}
