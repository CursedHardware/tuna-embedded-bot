import { Composer } from 'telegraf'
import * as SZLCSC from './szlcsc'
import * as SEMIEE from './semiee'
import { getKeyword } from './utils'
import { group } from './middlewares'

export const Finder = Composer.command('/find', async (ctx) => {
  const keyword = getKeyword(ctx.message)
  {
    const products = await SZLCSC.search(keyword)
    if (products?.[0]) return group(ctx, `Reading ${products[0].code}`, () => SZLCSC.handle(ctx, products[0].code))
  }
  {
    const products = await SEMIEE.search(keyword)
    if (products?.[0]) return group(ctx, `Reading ${products[0].model}`, () => SEMIEE.handle(ctx, products[0].id))
  }
  throw new Error('Not Found')
})
