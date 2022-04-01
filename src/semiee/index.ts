import fetch from 'node-fetch'
import { Context, Markup } from 'telegraf'
import type { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat, { ParamMap } from 'urlcat'
import { getPDFCover } from '../pdf'
import { getLuckyURL } from '../utils'
import type { Payload, Product, SearchedResult } from './types'

const HOST = 'https://www.semiee.com'
const HOST_API = urlcat(HOST, '/bdxx-api/chip')

export async function search(model: string, pageIndex = 0, pageSize = 10) {
  return get<SearchedResult[]>('/search', { model, pageIndex, pageSize })
}

export async function handle(ctx: Context, id: string) {
  const product = await get<Product>('/detail/:id', { id })
  const brandName = product.brand_name.split('-', 2)[1]
  // prettier-ignore
  const lines = [
    brandName,
    product.model,
    ...(await getDatasheet(id)),
  ]
  // prettier-ignore
  const datasheetURL = product.dsFile && /\.pdf$/i.test(product.dsFile.path)
    ? product.dsFile.path
    : getLuckyURL(`${brandName} ${product.model} datasheet filetype:pdf`)
  // prettier-ignore
  const markup = Markup.inlineKeyboard([
    Markup.button.url('Details', urlcat(HOST, '/:id.html', { id })),
    Markup.button.url('Datasheet', datasheetURL),
  ])
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
    reply_markup: markup.reply_markup,
  }
  if (ctx.chat?.type === 'private' && product.dsFile) {
    const source = await getPDFCover(product.dsFile.path)
    if (source) {
      await ctx.replyWithPhoto({ source }, { ...extra, reply_markup: undefined })
    }
    // prettier-ignore
    await ctx.replyWithDocument(
      { url: product.dsFile.path, filename: product.dsFile.name },
      { caption: lines.join('\n'), ...extra },
    )
  } else {
    await ctx.reply(lines.join('\n'), extra)
  }
}

export async function getDatasheet(id: string) {
  const product = await get<Product>('/:id/technicalparam', { id })
  return product.params.map((item) => `${item.name}: ${item.value}`)
}

async function get<T>(pathname: string, params: ParamMap = {}) {
  const response = await fetch(urlcat(HOST_API, pathname, params))
  const payload: Payload<T> = await response.json()
  if (payload.code !== 0) throw new Error(payload.remark)
  return payload.result
}
