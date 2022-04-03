import { Composer } from 'telegraf'
import * as FlashInfo from './flashinfo'
import * as SEMIEE from './semiee'
import * as SZLCSC from './szlcsc'
import { getQuery, group, isBotCommand } from './utils/telegraf'
import * as XCC from './xcc'

export const AnyText = Composer.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()
  if (isBotCommand(ctx.message)) return next()
  const products = await SZLCSC.getProducts(ctx.message)
  if (!products.length) return next()
  return Promise.all(
    products.map((code) => group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))),
  )
})

export const Finder = Composer.command(
  '/find',
  async (ctx, next) => {
    const products = await SZLCSC.find(getQuery(ctx.message))
    if (products.length === 0) return next()
    const { code } = products[0]
    return group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))
  },
  async (ctx, next) => {
    const products = await SEMIEE.find(getQuery(ctx.message))
    if (products.length === 0) return next()
    const { id, model } = products[0]
    return group(ctx, `Reading <code>${model}</code> from semiee.com`, () => SEMIEE.handle(ctx, id))
  },
  async (ctx, next) => {
    const products = await XCC.find(getQuery(ctx.message))
    if (products.length === 0) return next()
    const { title } = products[0]
    return group(ctx, `Reading <code>${title}</code> from xcc.com`, () => XCC.handle(ctx, products[0]))
  },
  async (ctx, next) => {
    const products = await FlashInfo.find(getQuery(ctx.message))
    if (products.length === 0) return next()
    const model = products[0]
    return group(ctx, `Reading <code>${model}</code> from flashinfo.top`, () => FlashInfo.handle(ctx, model))
  },
  (ctx) => ctx.reply('No Result', { reply_to_message_id: ctx.message.message_id }),
)
