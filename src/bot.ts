import { Telegraf } from 'telegraf'
import { Finder } from './finder'
import { Console, ErrorHandler, limitGroupChatIDs } from './handler'
import { bot as SZLCSC } from './szlcsc'
import { bot as XCC } from './xcc'

export const bot = new Telegraf(process.env.BOT_TOKEN ?? '')

// prettier-ignore
bot.use(limitGroupChatIDs(
  -1001232571812 /* internal group */,
  -1001630828458 /* test group */
))

bot.use(Console)
bot.use(ErrorHandler)
bot.use(Finder)
bot.use(SZLCSC)
bot.use(XCC)
