import { Composer } from 'telegraf'
import { group } from '../utils/telegraf'
import { handle } from './handler'
import { getProductCodeList } from './utils'

export const bot = Composer.command('/lc', async (ctx) => {
  const { via_bot, reply_to_message } = ctx.message
  if (via_bot) return
  const codeList = new Set([
    ...(await getProductCodeList(ctx.message)),
    ...(reply_to_message && 'text' in reply_to_message ? await getProductCodeList(reply_to_message) : []),
  ])
  for (const code of codeList) {
    await group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => handle(ctx, code))
  }
})
