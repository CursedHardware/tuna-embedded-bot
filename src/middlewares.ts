import { Composer, Context } from 'telegraf'

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
