import fetch, { RequestInit } from 'node-fetch'
import { Context, Markup } from 'telegraf'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat, { ParamMap } from 'urlcat'
import { getPDFCover, isPDF } from '../pdf'
import { NoResultError, SemieeError } from '../types'
import { download, getDatasheetURL } from '../utils'
import type { Payload, Product, SearchedResult } from './types'

const HOST = 'https://www.semiee.com'
const HOST_API = urlcat(HOST, '/bdxx-api/chip')

export async function search(model: string, pageIndex = 0, pageSize = 10) {
  const results = await get<SearchedResult[]>('/search', { model, pageIndex, pageSize })
  if (results.length === 0) throw new NoResultError()
  return results
}

export async function handle(ctx: Context, id: string) {
  const product = await get<Product>('/detail/:id', { id })
  const brandName = product.brand_name.split('-', 2)[1]
  const caption = `${brandName} ${product.model}`
  const dsURL = await getDatasheetURL(product.dsFile?.path, brandName, product.model)
  const markup = Markup.inlineKeyboard(
    [Markup.button.url('半导小芯', urlcat(HOST, '/:id.html', { id })), Markup.button.url('Datasheet', dsURL ?? '', !dsURL)],
    { columns: 1 }
  )
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
    reply_markup: markup.reply_markup,
  }
  if (ctx.chat?.type === 'private' && isPDF(dsURL)) {
    const source = await download(dsURL)
    await ctx.replyWithPhoto({ source: await getPDFCover(source) }, { ...extra, reply_markup: undefined })
    await ctx.replyWithDocument({ source, filename: product.dsFile?.name ?? `${product.model}.pdf` }, { ...extra, caption })
  } else {
    await ctx.reply(caption, extra)
  }
}

async function get<T>(pathname: string, params: ParamMap = {}, init?: RequestInit) {
  const response = await fetch(urlcat(HOST_API, pathname, params), init)
  const payload: Payload<T> = await response.json()
  if (payload.code !== 0) throw new SemieeError(payload.remark)
  return payload.result
}
