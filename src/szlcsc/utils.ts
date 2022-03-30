import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { toReadableNumber } from '../utils'
import { Payload, ProductChina, ProductIntl } from './types'

export function getPackage(p: ProductIntl) {
  return `${toReadableNumber(p.minPacketNumber)} ${p.productUnit}/${p.minPacketUnit}`
}

export function getInStock(p: ProductIntl, stock: number) {
  if (stock === 0) return 'Out of Stock'
  const packet = `${toReadableNumber(stock / p.minPacketNumber)} ${p.minPacketUnit}`
  return `${toReadableNumber(stock)} ${p.productUnit} (${packet})`
}

export async function getProductCodeFromId(productId: number) {
  const result = await getProductFromChina(productId)
  return result.code
}

export async function getProductIdFromCode(code: string) {
  const link = urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword: code })
  const response = await fetch(link)
  interface Product {
    id: number
    code: string
  }
  const payload: Payload<{ productList: Product[] }> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  const matched = payload.result.productList.find((p) => p.code === code)
  if (!matched) throw new Error('Not Found')
  return matched.id
}

export async function getProductFromChina(productId: number): Promise<ProductChina> {
  const response = await fetch(`https://item.szlcsc.com/phone/p/${productId}`)
  const payload: Payload<ProductChina> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  return payload.result
}
