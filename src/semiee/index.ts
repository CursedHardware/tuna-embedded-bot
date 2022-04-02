import fetch, { RequestInit } from 'node-fetch'
import { Context } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { reply } from '../utils/reply'
import { Payload, Product, SearchedResult, SemieeError } from './types'

const HOST = 'https://www.semiee.com'
const HOST_API = urlcat(HOST, '/bdxx-api/chip')

export async function find(model: string, pageIndex = 0, pageSize = 1) {
  return get<SearchedResult[]>('/search', { model, pageIndex, pageSize })
}

export async function handle(ctx: Context, id: string) {
  const product = await get<Product>('/detail/:id', { id })
  const brand = product.brand_name.split('-', 2)[1]
  return reply(ctx, {
    brand,
    model: product.model,
    datasheet() {
      const { name, path } = product.dsFile ?? {}
      return { url: path, name: name ?? `${brand}_${product.model}.pdf` }
    },
    *html() {
      yield `Brand: <code>${brand}</code>`
      yield `Model: <code>${product.model}</code>`
    },
    *markup() {
      yield { text: '半导小芯', url: urlcat(HOST, '/:id.html', { id }) }
    },
  })
}

async function get<T>(pathname: string, params: ParamMap = {}, init?: RequestInit) {
  const response = await fetch(urlcat(HOST_API, pathname, params), init)
  const payload: Payload<T> = await response.json()
  if (payload.code !== 0) throw new SemieeError(payload.remark)
  return payload.result
}
