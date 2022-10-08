import Decimal from 'decimal.js'
import { toReadableNumber } from '../utils/number'
import { formatPrice } from './product'

export interface Product {
  id: number
  code: string
  brand: string
  model: string
  datasheetURL?: string
  package: Package
  stocks: ProductStock[]
  prices: ProductPrice[]
  photos: string[]
  links: Record<string, string>
}

export class Package implements Package.Options {
  public readonly standard: string
  public readonly minUnit: string
  public readonly unit: string
  public readonly amount: number

  constructor(options: Package.Options) {
    this.standard = options.standard
    this.minUnit = options.minUnit
    this.unit = options.unit
    this.amount = options.amount
  }

  toStockString(amount: Decimal.Value) {
    return `${toReadableNumber(amount)} ${this.minUnit} (${this.toMinStockUnitString(amount)})`
  }

  toMinStockUnitString(amount: Decimal.Value) {
    amount = new Decimal(amount)
    return `${toReadableNumber(amount.div(this.amount), { decimalPlaces: 2 })} ${this.unit}`
  }

  toStartPriceString({ price, start, symbol }: ProductPrice, amount = start) {
    const title = this.amount === amount ? `1 ${this.unit}` : `${toReadableNumber(amount)} ${this.minUnit}`
    const totalPrice = new Decimal(price).mul(amount).toFixed(2)
    return `${title}: ${toReadableNumber(totalPrice)} ${symbol}`
  }

  toPriceString({ start, price }: ProductPrice) {
    return `${toReadableNumber(start)}+: ${formatPrice(price, this.minUnit)}`
  }

  toString() {
    return `${toReadableNumber(this.amount)} ${this.minUnit}/${this.unit}`
  }
}

export namespace Package {
  export interface Options {
    standard: string
    minUnit: string
    unit: string
    amount: number
  }
}

export interface ProductStock {
  area: string
  amount: number
}

export interface ProductPrice {
  start: number
  price: number
  symbol: string
}

export class SZLCSCError extends Error {
  name = 'SZLCSCError'
}
