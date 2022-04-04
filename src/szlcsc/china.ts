import urlcat from 'urlcat'
import { Payload, ProductChina, SearchedProduct, SZLCSCError } from './types'

export async function find(keyword: string) {
  const response = await fetch(urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword }))
  const payload: Payload<{ productList: SearchedProduct[] }> = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
  return payload.result.productList ?? []
}

export async function getProductFromChina(id: number): Promise<ProductChina> {
  const response = await fetch(`https://item.szlcsc.com/phone/p/${id}`)
  const payload: Payload<ProductChina> = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
  return payload.result
}
