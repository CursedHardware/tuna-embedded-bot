import { Composer, Telegraf } from 'telegraf'
import { Finder } from './finder'
import { ErrorHandler, limitGroupChatIDs } from './middlewares'
import { bot as SZLCSC } from './szlcsc'
import { bot as XCC } from './xcc'

export const bot = new Telegraf(process.env.BOT_TOKEN ?? '')

// prettier-ignore
bot.use(
  limitGroupChatIDs(-1001232571812, -1001630828458),
  Composer.log(console.log.bind(console)),
  ErrorHandler,
  Finder,
  SZLCSC,
  XCC
)
