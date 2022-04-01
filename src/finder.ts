import { Composer, Context } from 'telegraf'
import { group } from './middlewares'
import * as SEMIEE from './semiee'
import * as SZLCSC from './szlcsc'
import { NoResultError } from './types'
import { getKeyword } from './utils'

export const Finder = Composer.command('/find', (ctx) => {
  const keyword = getKeyword(ctx.message)
  return findSZLCSC(ctx, keyword)
    .catch(() => findSEMIEE(ctx, keyword))
    .catch(() => new NoResultError())
})

async function findSZLCSC(ctx: Context, keyword: string) {
  const products = await SZLCSC.search(keyword)
  const { code } = products[0]
  return group(ctx, `Reading ${code}`, () => SZLCSC.handle(ctx, code))
}

async function findSEMIEE(ctx: Context, keyword: string) {
  const products = await SEMIEE.search(keyword)
  const { id, model } = products[0]
  return group(ctx, `Reading ${model}`, () => SEMIEE.handle(ctx, id))
}
