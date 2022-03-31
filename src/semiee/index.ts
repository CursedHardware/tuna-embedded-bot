import fetch from 'node-fetch'
import { Context } from 'telegraf'
import type { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat from 'urlcat'
import { Payload, Product, SearchedResult } from './types'

const HOST = 'https://www.semiee.com'
const HOST_API = urlcat(HOST, '/bdxx-api/chip')

export async function search(model: string, pageIndex = 0, pageSize = 10) {
  return get<SearchedResult[]>(urlcat('/search', { pageIndex, pageSize, model }))
}

export async function handle(ctx: Context, id: string) {
  const product = await get<Product>(urlcat('/detail/:id', { id }))
  const lines = [product.brand_name, product.model, ...(await getDatasheet(id))]
  const reply_markup: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: 'Details', url: urlcat(HOST, '/:id.html', { id }) },
        { text: 'Datasheet', url: product.dsFile.path },
      ],
    ],
  }
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
    reply_markup,
  }
  if (ctx.chat?.type === 'private') {
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
  const product = await get<Product>(urlcat('/:id/technicalparam', { id }))
  return product.params.map((item) => `${item.name}: ${item.value}`)
}

async function get<T>(pathname: string) {
  const response = await fetch(urlcat(HOST_API, pathname))
  const payload: Payload<T> = await response.json()
  if (payload.code !== 0) throw new Error(payload.remark)
  return payload.result
}
