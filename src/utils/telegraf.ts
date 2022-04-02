import { Composer, Context } from 'telegraf'
import { Message, MessageEntity } from 'telegraf/typings/core/types/typegram'
import { NoResultError } from '../types'

export function isBotCommand({ entities }: Message.TextMessage) {
  const entity = entities?.[0]
  return entity?.type === 'bot_command' && entity.offset === 0
}

export function getQuery({ text, entities }: Message.TextMessage) {
  const entity = entities?.[0]
  if (entity?.type !== 'bot_command') throw new SyntaxError()
  const keyword = text.slice(entity.offset + entity.length).trim()
  if (keyword.length === 0) throw new NoResultError()
  return keyword
}

export function* getEntities({ text, entities }: Message.TextMessage, type: MessageEntity['type']) {
  for (const entity of entities ?? []) {
    if (entity.type !== type) continue
    yield text.slice(entity.offset, entity.offset + entity.length)
  }
}

export async function group(ctx: Context, text: string, callback: () => Promise<unknown>) {
  const holdMessage = await ctx.reply(text, {
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
  })
  try {
    await callback()
  } finally {
    await ctx.deleteMessage(holdMessage.message_id)
  }
}

export const limitGroupChatIDs = (...chatIDs: number[]) => {
  return Composer.groupChat((ctx, next) => {
    if (chatIDs.includes(ctx.chat?.id ?? Number.NaN)) return next()
    return ctx.leaveChat()
  })
}

export const ErrorHandler = Composer.unwrap(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error({ error })
    return ctx.reply(`<pre>${error}</pre>`, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message?.message_id,
    })
  }
})
