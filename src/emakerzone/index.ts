import { Context } from 'telegraf'
import urlcat from 'urlcat'
import { reply } from '../utils/reply'
import { get } from './handler'
import { routes, SearchedResult } from './types'

export async function find(keywords: string) {
  const { list } = await get<{ list: SearchedResult[] }>('/e-select/fe/search', {
    keywords,
    pageNum: 1,
    pageSize: 1,
  })
  return list
}

export async function handle(ctx: Context, product: SearchedResult) {
  return reply(ctx, {
    brand: product.brand,
    model: product.pat_number,
    datasheet: {
      name: `${product.brand}_${product.pat_number}.pdf`,
      url: product.link,
    },
    links: {
      创易栈: urlcat('http://new.emakerzone.com', `${routes[product.tag]}_info`, { modelid: product.id }),
    },
    *html() {
      yield `Brand: <code>${product.brand}</code>`
      yield `Model: <code>${product.pat_number}</code>`
      yield `Package: <code>${product.package}</code>`
      yield `Description: <code>${product.description}</code>`
    },
  })
}
