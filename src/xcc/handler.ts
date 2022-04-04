import fetch from 'node-fetch'
import { Context } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { reply } from '../utils/reply'
import { WareDetailRow, XCCError } from './types'

export async function find(searchContent: string, pageIndex = 1, pageSize = 1) {
  const response = await get<{ rows: WareDetailRow[] }>('https://www.xcc.com/xcc-api/search/pc/ware-detail', {
    pageIndex,
    pageSize,
    searchContent,
  })
  return response.rows
}

export async function findMark(searchContent: string) {
  interface Row {
    smd: string
    title: string
  }
  const { rows } = await get<{ rows: Row[] }>('https://app-api.xcc.com/search/wareSmd', {
    searchContent,
    pageIndex: 1,
    pageSize: 50,
  })
  return rows
}

export async function findPin2Pin(searchContent: string) {
  interface Row {
    level: number
    pinTitle: string
  }
  const { pageResult } = await get<{ pageResult: { rows: Row[] } }>('https://app-api.xcc.com/search/ware-pin', {
    searchContent,
    pageIndex: 1,
    pageSize: 50,
  })
  return pageResult.rows
}

export async function handle(ctx: Context, product: WareDetailRow) {
  const brand = product.brandName.split('-')[0]
  return reply(ctx, {
    brand,
    model: product.title,
    datasheet: {
      url: product.pdfUrl,
      name: `${brand}_${product.title}.pdf`,
    },
    *html() {
      yield `Brand: <code>${brand}</code>`
      yield `Model: <code>${product.title}</code>`
    },
  })
}

export async function get<T>(pathname: string, params: ParamMap = {}) {
  interface Payload {
    code: number
    msg: string
    data: T
  }
  const response = await fetch(urlcat(pathname, params))
  const payload: Payload = await response.json()
  if (payload.code !== 200) throw new XCCError(payload.msg)
  return payload.data
}
