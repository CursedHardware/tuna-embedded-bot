import { Telegraf } from 'telegraf'
import SZLCSC from './szlcsc'

export const bot = new Telegraf(process.env.BOT_TOKEN ?? '')

bot.use(async (ctx, next) => {
  console.log(ctx.message)
  try {
    await next()
  } catch (error) {
    await ctx.reply(`<pre>${error} (${ctx.update.update_id})</pre>`, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message?.message_id,
    })
    console.error(`Error`, error, ctx.update.update_id)
  }
})

bot.use(SZLCSC)
