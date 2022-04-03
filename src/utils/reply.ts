import { Context, Markup } from 'telegraf'
import type { InlineKeyboardButton, InputFile, Update } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { download, getLuckyURL } from './datasheet'
import { getPDFPage, isPDF } from './pdf'

interface ReplyOptions {
  brand: string
  model: string
  datasheet?: DatasheetOptions
  html(prices: PriceItem[]): Generator<string>
  prices?(): Generator<PriceItem>
  photos?(): Generator<InputFile> | InputFile[]
  markup?(): Generator<InlineKeyboardButton>
}

export interface PriceItem {
  start: number
  price: number
  symbol: string
}

export interface DatasheetOptions {
  url?: string
  fileName?: string
  query?(brand: string, model: string): string[]
}

export async function reply(ctx: Context<Update>, options: ReplyOptions) {
  const prices = Array.from(options.prices?.() ?? [])
  const caption = Array.from(options.html(prices)).join('\n')
  const buttons = Array.from(options.markup?.() ?? [])
  const photos: InputFile[] = Array.from(options.photos?.() ?? [])
  const dsURL = await getDatasheetURL(options.datasheet, options.brand, options.model)
  if (dsURL) buttons.push({ text: 'Datasheet', url: dsURL })
  const extra: ExtraReplyMessage = { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id }
  if (buttons.length) {
    extra.reply_markup = Markup.inlineKeyboard(buttons, { columns: 2 }).reply_markup
  }
  if (ctx.chat?.type === 'private' && isPDF(dsURL)) {
    const pdfSource = await download(dsURL)
    if (pdfSource) {
      try {
        photos.unshift({ source: await getPDFPage(pdfSource, 0) })
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
    if (pdfSource) {
      await ctx.replyWithDocument({ source: pdfSource, filename: options.datasheet?.fileName }, { ...extra, caption })
    }
  } else if (photos[0]) {
    await ctx.replyWithPhoto(photos[0], { ...extra, caption })
  } else {
    await ctx.reply(caption, extra)
  }
}

async function getDatasheetURL(ds: DatasheetOptions | undefined, brand: string, model: string) {
  if (isPDF(ds?.url)) return ds?.url
  const query = ds?.query?.(brand, model) ?? makeDatasheetKeywords(brand, model)
  if (query.length === 0) return
  return getLuckyURL(query.join(' '))
}

function makeDatasheetKeywords(brand: string, model: string) {
  const query = ['datasheet', 'filetype:pdf']
  if (model.length < 5 || /^[\d-_]+$/.test(model)) {
    query.unshift(brand, model)
  } else {
    query.unshift(model)
  }
  return query
}
