import fetch from 'node-fetch'
import { Context } from 'telegraf'
import urlcat from 'urlcat'
import { reply } from '../utils/reply'
import { API_PLATFORM, Payload, routes, SearchedResult } from './types'

export async function find(keywords: string) {
  const response = await fetch(urlcat(API_PLATFORM, '/e-select/fe/search', { keywords, pageNum: 1, pageSize: 1 }))
  const payload: Payload<{ list: SearchedResult[] }> = await response.json()
  if (payload.errno !== 0) throw new Error(payload.errmsg)
  return payload.data.list
}

export async function handle(ctx: Context, product: SearchedResult) {
  return reply(ctx, {
    brand: product.brand,
    model: product.pat_number,
    datasheet() {
      return {
        name: `${product.brand}_${product.pat_number}.pdf`,
        url: product.link,
      }
    },
    *html() {
      yield `Brand: <code>${product.brand}</code>`
      yield `Model: <code>${product.pat_number}</code>`
      yield `Package: <code>${product.package}</code>`
      yield `Description: <code>${product.description}</code>`
    },
    *markup() {
      yield {
        text: '创易栈',
        url: urlcat('http://new.emakerzone.com', `${routes[product.tag]}_info`, { modelid: product.id }),
      }
    },
  })
}
