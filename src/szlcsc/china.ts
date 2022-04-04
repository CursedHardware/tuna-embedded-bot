import _ from 'lodash'
import { ParamMap } from 'urlcat'
import { ProductChina, SearchedProduct, SZLCSCError } from './types'

export async function find(keyword: string) {
  const { productList } = await get<{ productList: SearchedProduct[] }>(
    'https://so.szlcsc.com/phone/p/product/search',
    { keyword },
  )
  return productList ?? []
}

export async function getProductFromChina(id: number) {
  return get<ProductChina>('https://item.szlcsc.com/phone/p/:id', { id })
}

export async function getProductIdFromCode(code: string) {
  code = code.toUpperCase()
  const products = await find(code)
  return _.find(products, ['code', code])?.id
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
