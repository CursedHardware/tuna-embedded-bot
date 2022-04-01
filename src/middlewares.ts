import { Composer, Context } from 'telegraf'

export async function group(ctx: Context, text: string, callback: () => Promise<unknown>) {
  const holdMessage = await ctx.reply(text, {
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
  })
  const startTime = Date.now()
  const intervalId = setInterval(() => {
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000) | 0
    ctx.telegram.editMessageText(ctx.chat?.id, holdMessage.message_id, undefined, `${text} (${duration}s)`)
  }, 1000)
  try {
    await callback()
    clearTimeout(intervalId)
  } finally {
    await ctx.deleteMessage(holdMessage.message_id)
  }
}

export const Console = Composer.log(console.log.bind(console))

export const limitGroupChatIDs = (...chatIDs: number[]) => {
  return Composer.groupChat((ctx, next) => {
    if (chatIDs.includes(ctx.chat?.id ?? Number.NaN)) return next()
    return ctx.leaveChat()
  })
}

export const ErrorHandler = Composer.catch((error, ctx) => {
  console.error(`Error`, error)
  return ctx.reply(`<pre>${error}</pre>`, {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message?.message_id,
  })
})
