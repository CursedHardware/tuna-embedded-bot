import type { Context } from 'telegraf'
import { reply } from '../utils/reply'
import { getProductFromChina, getProductIdFromCode } from './china'
import { getProductFromIntl } from './intl'
import { getInStock, getPackage, makePriceList, makeStartPrice } from './product'
import { SZLCSCError } from './types'
export { find } from './china'

export async function handle(ctx: Context, code: string) {
  const product = await getProduct(code)
  return reply(ctx, {
    brand: product.brand,
    model: product.model,
    photos: product.photos,
    datasheet() {
      const name = `${product.code}_${product.model}.pdf`
      return { url: product.datasheetURL, name }
    },
    *html() {
      yield `Part#: <code>${product.code}</code>`
      yield `Brand: <code>${product.brand}</code>`
      yield `Model: <code>${product.model}</code>`
      yield `Package: <code>${product.package.standard}</code> (${getPackage(product.package)})`
      for (const stock of product.stocks) {
        yield `Stock (${stock.area}): ${getInStock(product.package, stock.amount)}`
      }
      {
        const prices = product.prices.filter((_) => _.symbol === 'CNY')
        if (prices.length > 0) {
          yield `Price List (CNY): ${makePriceList(prices, product.package)}`
          if (prices[0].start > 1) {
            yield `Start Price: ${makeStartPrice(prices, product.package)}`
          }
        }
      }
      {
        const prices = product.prices.filter((_) => _.symbol === 'USD')
        if (prices.length > 0) {
          yield `Price List (USD): ${makePriceList(prices, product.package)}`
          if (prices[0].start > 1) {
            yield `Start Price: ${makeStartPrice(prices, product.package)}`
          }
        }
      }
    },
    *markup() {
      yield { text: product.code, url: `https://lcsc.com/product-detail/${product.code}.html` }
      yield { text: '立创商城', url: `https://item.szlcsc.com/${product.id}.html` }
    },
  })
}

async function getProduct(code: string) {
  code = code.toUpperCase()
  try {
    const product = await getProductFromIntl(code)
    const productChina = await getProductFromChina(product.id)
    product.prices.push(...productChina.prices)
    return product
  } catch {
    const productId = await getProductIdFromCode(code)
    if (!productId) throw new SZLCSCError('No Found')
    return getProductFromChina(productId)
  }
}
