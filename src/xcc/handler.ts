import fetch from 'node-fetch'
import { Context } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { reply } from '../utils/reply'
import { Payload, WareDetailRow, XCCError } from './types'

export async function find(searchContent: string, pageIndex = 1, pageSize = 1) {
  const response = await get<{ rows: WareDetailRow[] }>('/search/pc/ware-detail', {
    pageIndex,
    pageSize,
    searchContent,
  })
  return response.rows
}

export async function handle(ctx: Context, product: WareDetailRow) {
  const brand = product.brandName.split('-')[0]
  return reply(ctx, {
    brand,
    model: product.title,
    datasheet() {
      const name = `${brand}_${product.title}.pdf`
      return { url: product.pdfUrl, name }
    },
    *html() {
      yield `Brand: <code>${brand}</code>`
      yield `Model: <code>${product.title}</code>`
    },
  })
}

async function get<T>(pathname: string, params: ParamMap = {}) {
  const response = await fetch(urlcat('https://www.xcc.com/xcc-api', pathname, params))
  const payload: Payload<T> = await response.json()
  if (payload.code !== 200) throw new XCCError(payload.msg)
  return payload.data
}
