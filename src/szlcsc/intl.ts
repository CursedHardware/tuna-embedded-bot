import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { ProductIntl, SZLCSCError } from './types'

export const HOST = 'https://wwwapi.lcsc.com/v1'

export async function getProductFromIntl(product_code: string) {
  const response = await fetch(urlcat(HOST, '/products/detail', { product_code }))
  const payload: ProductIntl = await response.json()
  if (!payload?.brandNameEn) throw new SZLCSCError('No Result')
  return payload
}

export async function findSearchLink(keyword: string, type = 'LCSC Part Number') {
  const response = await fetch(urlcat(HOST, '/search/search-link', { type, keyword }))
  interface Payload {
    url: string
  }
  const payload: Payload = await response.json()
  return payload?.url
}
