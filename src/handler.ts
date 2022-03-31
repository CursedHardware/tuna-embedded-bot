import { Composer, Context, Middleware } from 'telegraf'

export const Console: Middleware<Context> = (ctx, next) => {
  console.log(ctx.message)
  return next()
}

export const limitGroupChatIDs = (...chatIDs: number[]) => {
  return Composer.groupChat((ctx, next) => {
    if (chatIDs.includes(ctx.chat?.id ?? Number.NaN)) return next()
    return ctx.leaveChat()
  })
}

export const ErrorHandler: Middleware<Context> = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    await ctx.reply(`<pre>${error}</pre>`, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message?.message_id,
    })
    console.error(`Error`, error)
  }
}
