import fetch from 'node-fetch'
import { Composer, Context } from 'telegraf'
import type { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat from 'urlcat'
import { getLuckyURL, toReadableNumber } from '../utils'
import type { ProductIntl } from './types'
import { getInStock, getPackage, getProductCodeFromId, getProductFromChina, search } from './utils'

const bot = new Composer()

const isProductURL = (input: string) => {
  const url = new URL(input)
  if (url.host === 'item.szlcsc.com') {
    return /(?<id>\d+)\.html$/.exec(url.pathname)
  } else if (url.host === 'm.szlcsc.com') {
    const id = url.searchParams.get('productId')
    return /^(?<id>\d+)$/.exec(id ?? '')
  } else if (url.host === 'lcsc.com') {
    return /(?<code>C\d+)\.html$/.exec(url.pathname)
  }
  return null
}

bot.url(isProductURL, async (ctx) => {
  const { id, code } = ctx.match.groups ?? {}
  if (code) {
    return handle(ctx, code.toUpperCase())
  } else if (id) {
    return handle(ctx, await getProductCodeFromId(Number.parseInt(id, 10)))
  }
})

bot.hears(/^(?<code>C(?:\d+))$/i, (ctx) => {
  if (!ctx.match.groups?.code) return
  return handle(ctx, ctx.match.groups.code)
})

bot.command('/lc', async (ctx) => {
  const matches = Array.from(ctx.message.text.matchAll(/C\d+/g)).map((match) => match[0])
  await Promise.all(matches.map((code) => handle(ctx, code)))
})

bot.command('/find', async (ctx) => {
  const { text, entities } = ctx.message
  const keyword = text.slice(entities![0].offset + entities![0].length).trim()
  const products = await search(keyword)
  if (!products?.[0]) throw new Error('Not Found')
  return handle(ctx, products[0].code)
})

export default bot

async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  const reply_to_message_id = ctx.message?.message_id
  const lines = [
    `Brand: <code>${product.brandNameEn}</code>`,
    `Model: <code>${product.productModel}</code>`,
    `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`,
    `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`,
    `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`,
    `Price List (CNY): ${makeSimpleList(productChina.priceList)
      .map((_) => `${toReadableNumber(_.startNumber)}+: ${_.price}`)
      .join(', ')}`,
    `Price List (USD): ${makeSimpleList(product.productPriceList)
      .map((_) => `${toReadableNumber(_.ladder)}+: ${_.usdPrice}`)
      .join(', ')}`,
  ]
  lines.push(...makeDatasheetPreview(product.paramVOList))
  const reply_markup: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: product.productCode, url: `https://www.lcsc.com/product-detail/${product.productCode}.html` },
        { text: product.productId.toString(), url: `https://item.szlcsc.com/${product.productId}.html` },
      ],
      [{ text: 'Datasheet', url: product.pdfUrl ? product.pdfUrl : getLuckyURL(`${product.brandNameEn} ${product.productModel} datasheet filetype:pdf`) }],
    ],
  }
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_to_message_id,
    reply_markup,
  }
  if (product.productImages[0]) {
    return ctx.replyWithPhoto({ url: product.productImages[0] }, { caption: lines.join('\n'), ...extra })
  } else {
    return ctx.reply(lines.join('\n'), extra)
  }
}

async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const link = urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code })
  const response = await fetch(link)
  const detail = await response.json()
  if (detail?.length === 0) throw new Error('Not Found')
  return detail
}

function makeDatasheetPreview(elements: ProductIntl['paramVOList']) {
  if (!elements) return []
  elements = elements.filter(({ paramValueEn: value }) => !(value === '-' || value === '0'))
  if (elements.length === 0) return []
  // elements.sort((a, b) => a.paramNameEn.localeCompare(b.paramNameEn, 'zh-CN'))
  return [
    'Datasheet:',
    ...elements.map((element) =>
      `${element.paramNameEn}: ${element.paramValueEn}`
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/KB/g, 'kB')
        .replace(/MHz/g, 'Mhz')
        .replace(/FLASH/g, 'Flash')
        .replace(/(\d+)KX(\d+)/g, '$1k x $2')
        .replace(/(\d+(?:\.\d+)?)V/g, '$1v')
        .replace(/\xAE/g, '')
    ),
  ]
}

function makeSimpleList<T>(elements: T[]): [T, T] {
  return [elements[0], elements[elements.length - 1]]
}
