import type { InputFile } from 'telegraf/typings/core/types/typegram'

export interface Product {
  id: number
  code: string
  brand: string
  model: string
  datasheetURL?: string
  package: ProductPackage
  stocks: ProductStock[]
  prices: ProductPrice[]
  photos: InputFile[]
  links: Record<string, string>
}

export interface ProductPackage {
  standard: string
  minUnit: string
  unit: string
  amount: number
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
