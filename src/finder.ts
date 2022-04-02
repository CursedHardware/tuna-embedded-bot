import { Composer, Context } from 'telegraf'
import * as SEMIEE from './semiee'
import * as SZLCSC from './szlcsc'
import { getKeyword, group, isBotCommand } from './utils'

export const AnyText = Composer.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()
  if (isBotCommand(ctx.message)) return next()
  const products = await SZLCSC.getProducts(ctx.message)
  if (!products.length) return next()
  return Promise.all(
    products.map((code) => group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))),
  )
})

export const Finder = Composer.command('/find', async (ctx) => {
  const keyword = getKeyword(ctx.message)
  await findSZLCSC(ctx, keyword).catch(() => findSEMIEE(ctx, keyword))
})

async function findSZLCSC(ctx: Context, keyword: string) {
  const products = await SZLCSC.find(keyword)
  const { code } = products[0]
  return group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => SZLCSC.handle(ctx, code))
}

async function findSEMIEE(ctx: Context, keyword: string) {
  const products = await SEMIEE.find(keyword)
  const { id, model } = products[0]
  return group(ctx, `Reading <code>${model}</code> from semiee.com`, () => SEMIEE.handle(ctx, id))
}
