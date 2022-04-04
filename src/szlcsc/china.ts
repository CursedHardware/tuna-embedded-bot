import Decimal from 'decimal.js'
import fetch from 'node-fetch'
import { InputFile } from 'telegraf/typings/core/types/typegram'
import { ParamMap } from 'urlcat'
import { Product, SZLCSCError } from './types'

export async function find(keyword: string) {
  interface Product {
    id: number
    code: string
  }
  const url = new URL('https://so.szlcsc.com/phone/p/product/search')
  url.searchParams.set('keyword', keyword)
  const { productList } = await get<{ productList: Product[] }>(url.toString())
  return productList ?? []
}

export async function getProductFromChina(id: number) {
  interface ProductSZLCSC {
    id: number
    code: string
    brandName: string
    model: string
    standard: string
    packageUnit: string
    stockUnit: string
    productMinEncapsulationNumber: number
    jsWarehouseStockNumber: number
    gdWarehouseStockNumber: number
    priceDiscount: { priceList: Array<{ discount: number; spNumber: number; price: number }> }
    priceList: Array<{ price: number; startNumber: number }>
    splitRatio: number
    image: string
  }
  const payload = await get<ProductSZLCSC>(`https://item.szlcsc.com/phone/p/${id}`)
  return Object.freeze<Product>({
    id: payload.id,
    code: payload.code,
    brand: payload.brandName.replace(/\(.+\)$/, ''),
    model: payload.model,
    package: {
      standard: payload.standard,
      minUnit: payload.stockUnit,
      unit: payload.packageUnit,
      amount: payload.productMinEncapsulationNumber,
    },
    stocks: [
      { area: 'Jiangsu', amount: payload.jsWarehouseStockNumber },
      { area: 'Shenzhen', amount: payload.gdWarehouseStockNumber },
    ],
    prices: payload.priceList.map(({ price, startNumber }, index) => ({
      symbol: 'CNY',
      start: new Decimal(startNumber).mul(payload.splitRatio).toNumber(),
      price: new Decimal(price).mul(payload.priceDiscount?.priceList[index].discount ?? '1').toNumber(),
    })),
    photos: payload.image.split('<$>').map((url): InputFile => ({ url })),
  })
}

export async function getProductIdFromCode(code: string) {
  code = code.toUpperCase()
  const products = await find(code)
  return products.find((_) => _.code === code)?.id
}

export async function get<T>(url: string, params: ParamMap = {}) {
  interface Payload {
    code: number
    msg: string
    result: T
  }
  const response = await fetch(url, params)
  const payload: Payload = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
  return payload.result
}
