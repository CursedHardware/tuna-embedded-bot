import { Composer, Telegraf } from 'telegraf'
import { AnyText, Finder } from './finder'
import { bot as Intel } from './intel'
import { bot as SZLCSC } from './szlcsc'
import { ErrorHandler, limitGroupChatIDs } from './utils/telegraf'
import { bot as XCC } from './xcc/bot'

export const bot = new Telegraf(process.env.BOT_TOKEN ?? '', {
  handlerTimeout: 840_000,
})

bot.use(
  ErrorHandler,
  Composer.log(console.log.bind(console)),
  limitGroupChatIDs(-1001232571812, -1001630828458, -1001716658258),
  AnyText,
  Finder,
  SZLCSC,
  XCC,
  Intel,
)
