import _ from 'lodash'
import path from 'path'
import { Context } from 'telegraf'
import type { InputFile, Update } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { download, getLuckyURL } from './datasheet'
import { getPDFPage, isPDF } from './pdf'

interface ReplyOptions {
  brand: string
  model: string
  photos?: string[]
  html(): Generator<string>
  datasheet?: Datasheet
  links?: Record<string, string>
}

export interface Datasheet {
  url?: string
  name?: string
  keywords?: string[]
}

export async function reply(ctx: Context<Update>, options: ReplyOptions) {
  const caption = Array.from(options.html()).join('\n')
  const datasheet = getDatasheet(options)
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
    reply_markup: {
      get inline_keyboard() {
        const buttons = Object.entries(options.links ?? {}).map(([text, url]) => ({ text, url }))
        return _.compact([
          ..._.chunk(buttons, 2),
          datasheet && 'url' in datasheet && [{ text: 'Datasheet', url: datasheet.url }],
        ])
      },
    },
  }
  const photos = (options.photos ?? []).map((url): InputFile => ({ url })) ?? []
  if (ctx.chat?.type === 'private' && datasheet && 'url' in datasheet && isPDF(datasheet.url)) {
    const source = await download(datasheet.url).catch(() => undefined)
    try {
      if (source) photos.unshift({ source: await getPDFPage(source, 0) })
    } catch (error) {
      console.error('pdf-page', { error })
    }
    if (photos.length) {
      await ctx.replyWithMediaGroup(
        photos.map((media) => ({ type: 'photo', media })),
        extra,
      )
    }
    if (source) await ctx.replyWithDocument(datasheet, { ...extra, caption })
  } else if (photos[0]) {
    await ctx.replyWithPhoto(photos[0], { ...extra, caption })
  } else {
    await ctx.reply(caption, extra)
  }
}

function getDatasheet({ datasheet, brand, model }: ReplyOptions): InputFile | undefined {
  if (!datasheet || datasheet.keywords?.length === 0) return
  if (isPDF(datasheet.url)) {
    return {
      url: datasheet.url,
      filename: datasheet.name ?? path.basename(datasheet.url),
    }
  }
  return {
    url: datasheet.keywords
      ? getLuckyURL(...datasheet.keywords)
      : getLuckyURL(/^[\d-_]{5,}$/.test(model) ? brand : undefined, model, 'datasheet', 'filetype:pdf'),
  }
}
