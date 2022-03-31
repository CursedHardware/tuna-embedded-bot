import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { toReadableNumber } from '../utils'
import { Payload, ProductChina, ProductIntl, ProductSearch } from './types'

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

export async function search(keyword: string) {
  const link = urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword })
  const response = await fetch(link)
  const payload: Payload<{ productList: ProductSearch[] }> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  return payload.result.productList
}

export async function getProductIdFromCode(code: string) {
  const products = await search(code)
  const matched = products.find((p) => p.code === code)
  if (!matched) throw new Error('Not Found')
  return matched.id
}

export async function getProductFromChina(productId: number): Promise<ProductChina> {
  const response = await fetch(`https://item.szlcsc.com/phone/p/${productId}`)
  const payload: Payload<ProductChina> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  return payload.result
}

export async function getProductCodeFromURL(input: string) {
  const url = new URL(input)
  if (url.host === 'item.szlcsc.com') {
    const match = /(?<id>\d+)\.html$/.exec(url.pathname)
    if (match?.groups?.id) return getProductCodeFromId(+match.groups.id)
  } else if (url.host === 'm.szlcsc.com') {
    const id = url.searchParams.get('productId')
    if (id) return getProductCodeFromId(+id)
  } else if (url.host === 'www.lcsc.com') {
    const match = /(?<code>C\d+)\.html$/.exec(url.pathname)
    if (match?.groups?.code) return match.groups.code
  }
  return null
}
