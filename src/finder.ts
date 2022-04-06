import { Composer } from 'telegraf'
import * as EMakerZone from './emakerzone'
import * as FlashInfo from './flashinfo'
import * as Octopart from './octopart'
import * as SEMIEE from './semiee'
import * as SZLCSC from './szlcsc'
import { getQuery, group, isBotCommand } from './utils/telegraf'
import * as XCC from './xcc'

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
  async (ctx, next) => {
    const products = await XCC.find(ctx.state.query)
    if (products.length === 0) return next()
    const { title } = products[0]
    return group(ctx, `Reading <code>${title}</code> from xcc.com`, () => XCC.handle(ctx, products[0]))
  },
  async (ctx, next) => {
    const products = await Octopart.find(ctx.state.query)
    if (products.length === 0) return next()
    const { mpn } = products[0]
    return group(ctx, `Reading <code>${mpn}</code> from octopart.com`, () => Octopart.handle(ctx, products[0]))
  },
  async (ctx, next) => {
    const products = await FlashInfo.find(ctx.state.query)
    if (products.length === 0) return next()
    const model = products[0]
    return group(ctx, `Reading <code>${model}</code> from flashinfo.top`, () => FlashInfo.handle(ctx, model))
  },
  async (ctx, next) => {
    const products = await EMakerZone.find(ctx.state.query)
    if (products.length === 0) return next()
    const { pat_number } = products[0]
    return group(ctx, `Reading <code>${pat_number}</code> from emakerzone.com`, () =>
      EMakerZone.handle(ctx, products[0]),
    )
  },
  (ctx) => ctx.reply('No Result', { reply_to_message_id: ctx.message.message_id }),
)
