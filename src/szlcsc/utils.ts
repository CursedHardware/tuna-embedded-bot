import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { NoResultError } from '../types'
import { toReadableNumber } from '../utils/number'
import { find } from './handler'
import { Payload, ProductChina, ProductIntl, SZLCSCError } from './types'

export function getPackage(p: ProductIntl) {
  return `${toReadableNumber(p.minPacketNumber)} ${p.productUnit}/${p.minPacketUnit}`
}

export function getInStock(p: ProductIntl, stock: number) {
  if (stock === 0) return 'Out of Stock'
  const packet = `${toReadableNumber(stock / p.minPacketNumber)} ${p.minPacketUnit}`
  return `${toReadableNumber(stock)} ${p.productUnit} (${packet})`
}

export async function getProductCodeFromId(id: number) {
  const result = await getProductFromChina(id)
  return result.code
}

export async function getProductIdFromCode(code: string) {
  const products = await find(code)
  const matched = products.find((p) => p.code === code)
  if (!matched) throw new NoResultError()
  return matched.id
}

export async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const response = await fetch(urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code }))
  const payload = await response.json()
  if (Array.isArray(payload)) throw new NoResultError()
  return payload
}

export async function getProductFromChina(id: number): Promise<ProductChina> {
  const response = await fetch(`https://item.szlcsc.com/phone/p/${id}`)
  const payload: Payload<ProductChina> = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
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
  } else if (url.host.endsWith('lcsc.com')) {
    const match = /(?<code>C\d+)\.html$/.exec(url.pathname)
    if (match?.groups?.code) return match.groups.code
  }
  return null
}
