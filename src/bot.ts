import { Composer, Telegraf } from 'telegraf'
import SZLCSC from './szlcsc'
import XCC from './xcc'

export const bot = new Telegraf(process.env.BOT_TOKEN ?? '')

// prettier-ignore
const chatIDs = [
  -1001232571812 /* internal group */,
  -1001630828458 /* test group */
]

bot.use(
  Composer.groupChat((ctx, next) => {
    if (chatIDs.includes(ctx.chat?.id ?? Number.NaN)) return next()
    return ctx.leaveChat()
  })
)

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

bot.use(XCC)
bot.use(SZLCSC)
