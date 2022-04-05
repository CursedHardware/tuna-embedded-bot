import fetch, { RequestInit } from 'node-fetch'
import { Context } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { reply } from '../utils/reply'
import { Product, SearchedResult, SemieeError } from './types'

const HOST = 'https://www.semiee.com'
const HOST_API = urlcat(HOST, '/bdxx-api/chip')

export async function find(model: string, pageIndex = 0, pageSize = 1) {
  return get<SearchedResult[]>('/search', { model, pageIndex, pageSize })
}

export async function handle(ctx: Context, id: string) {
  const product = await get<Product>(`/detail/${id}`)
  const brand = product.brand_name.split('-', 2)[1]
  return reply(ctx, {
    brand,
    model: product.model,
    datasheet: {
      url: product.dsFile?.path,
      name: product.dsFile?.name ?? `${brand}_${product.model}.pdf`,
    },
    links: {
      半导小芯: urlcat(HOST, `/${id}.html`),
    },
    *html() {
      yield `Brand: <code>${brand}</code>`
      yield `Model: <code>${product.model}</code>`
      yield ''
      yield product.descr
    },
  })
}

async function get<T>(pathname: string, params: ParamMap = {}, init?: RequestInit) {
  interface Payload {
    code: number
    remark: string
    result: T
  }
  const response = await fetch(urlcat(HOST_API, pathname, params), init)
  const payload: Payload = await response.json()
  if (payload.code !== 0) throw new SemieeError(payload.remark)
  return payload.result
}
