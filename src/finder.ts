import { Composer } from 'telegraf'
import * as SEMIEE from './semiee'
import * as SZLCSC from './szlcsc'
import { getQuery, group, isBotCommand } from './utils/telegraf'

export const AnyText = Composer.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()
  if (isBotCommand(ctx.message)) return next()
  const codeList = await SZLCSC.getProductCodeList(ctx.message)
  if (!codeList.size) return next()
  for (const code of codeList) {
    await group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))
  }
})

export const Finder = Composer.command(
  ['/find', '/first', '/search'],
  (ctx, next) => {
    ctx.state.query = getQuery(ctx.message)
    return next()
  },
  async (ctx, next) => {
    const products = await SZLCSC.find(ctx.state.query)
    if (products.length === 0) return next()
    const { code } = products[0]
    return group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))
  },
  async (ctx, next) => {
    const products = await SEMIEE.find(ctx.state.query)
    if (products.length === 0) return next()
    const { id, model } = products[0]
    return group(ctx, `Reading <code>${model}</code> from semiee.com`, () => SEMIEE.handle(ctx, id))
  },
  (ctx) => ctx.reply('No Result', { reply_to_message_id: ctx.message.message_id }),
)
