import _ from 'lodash'
import path from 'path'
import { Context, Markup } from 'telegraf'
import type { InlineKeyboardButton, InputFile, Update } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { download, getLuckyURL } from './datasheet'
import { getPDFPage, isPDF } from './pdf'

interface ReplyOptions {
  brand: string
  model: string
  html(prices: PriceItem[]): Generator<string>
  datasheet?(): Datasheet
  prices?(): Generator<PriceItem>
  photos?(): Generator<InputFile> | InputFile[]
  markup?(): Generator<InlineKeyboardButton>
}

export interface PriceItem {
  start: number
  price: number
  symbol: string
}

export interface Datasheet {
  url?: string
  name?: string
  keywords?: string[]
}

export async function reply(ctx: Context<Update>, options: ReplyOptions) {
  const prices = Array.from(options.prices?.() ?? [])
  const caption = Array.from(options.html(prices)).join('\n')
  const datasheet = await getDatasheet(options)
  const extra: ExtraReplyMessage = { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id }
  {
    const buttons = Array.from(options.markup?.() ?? [])
    extra.reply_markup = Markup.inlineKeyboard(buttons, { columns: 2 }).reply_markup
    if (datasheet) {
      extra.reply_markup.inline_keyboard.push([{ text: 'Datasheet', url: datasheet.url }])
    }
  }
  const photos: InputFile[] = Array.from(options.photos?.() ?? [])
  if (ctx.chat?.type === 'private' && datasheet && isPDF(datasheet.url)) {
    if (datasheet.source) {
      try {
        photos.unshift({ source: await getPDFPage(datasheet.source, 0) })
      } catch (error) {
        console.error('pdf-page', { error })
      }
    }
    if (photos.length) {
      await ctx.replyWithMediaGroup(
        photos.map((media) => ({ type: 'photo', media })),
        extra,
      )
    }
    if (datasheet.source) {
      await ctx.replyWithDocument(datasheet, { ...extra, caption })
    }
  } else if (photos[0]) {
    await ctx.replyWithPhoto(photos[0], { ...extra, caption })
  } else {
    await ctx.reply(caption, extra)
  }
}

async function getDatasheet({ datasheet, brand, model }: ReplyOptions) {
  const ds = datasheet?.()
  if (!ds || ds.keywords?.length === 0) return
  if (isPDF(ds.url)) {
    return {
      url: ds.url,
      filename: ds.name ?? path.basename(ds.url),
      source: await download(ds.url).catch(() => undefined),
    }
  }
  const keywords = _.compact(
    ds.keywords ?? [/^[\d-_]{5,}$/.test(model) ? brand : undefined, model, 'datasheet', 'filetype:pdf'],
  )
  return {
    url: getLuckyURL(keywords),
  }
}
