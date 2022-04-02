import fetch from 'node-fetch'
import { Context, Markup } from 'telegraf'
import type { InlineKeyboardButton, InputFile, Update } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { getDatasheetURL } from './datasheet'
import { getPDFPage, isPDF } from './pdf'

interface ReplyOptions {
  brand: string
  model: string
  dsURL: string | null | undefined
  fileName: string
  html(): Generator<string>
  photos?(): Generator<InputFile> | InputFile[]
  markup(): Generator<InlineKeyboardButton>
}

export async function reply(ctx: Context<Update>, options: ReplyOptions) {
  const caption = Array.from(options.html()).join('\n')
  const buttons = Array.from(options.markup())
  const photos: InputFile[] = Array.from(options.photos?.() ?? [])
  const dsURL = await getDatasheetURL(options.dsURL, options.brand, options.model)
  if (dsURL) buttons.push({ text: 'Datasheet', url: dsURL })
  const extra: ExtraReplyMessage = { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id }
  if (buttons.length) {
    extra.reply_markup = Markup.inlineKeyboard(buttons, { columns: 2 }).reply_markup
  }
  if (ctx.chat?.type === 'private' && isPDF(dsURL)) {
    const pdfSource = await (await fetch(dsURL)).buffer()
    if (pdfSource) {
      try {
        photos.unshift({ source: await getPDFPage(pdfSource, 2) })
        photos.unshift({ source: await getPDFPage(pdfSource, 1) })
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
      await ctx.replyWithDocument({ source: pdfSource, filename: options.fileName }, { ...extra, caption })
    }
  } else if (photos[0]) {
    await ctx.replyWithPhoto(photos[0], { ...extra, caption })
  } else {
    await ctx.reply(caption, extra)
  }
}
