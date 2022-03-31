import fetch from 'node-fetch'
import { Composer, Context } from 'telegraf'
import type { InlineKeyboardMarkup, InputMediaPhoto, Message } from 'telegraf/typings/core/types/typegram'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat from 'urlcat'
import { getKeyword, getLuckyURL, toReadableNumber } from '../utils'
import type { ProductIntl } from './types'
import { getInStock, getPackage, getProductCodeFromURL, getProductFromChina, search } from './utils'

const bot = new Composer()

bot.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()
  if (ctx.message.entities?.[0].type === 'bot_command') return next()
  return Promise.all((await getProducts(ctx.message)).map((code) => handle(ctx, code)))
})

bot.command('/lc', async (ctx) => {
  const products = await getProducts(ctx.message)
  if (ctx.message.reply_to_message && 'text' in ctx.message.reply_to_message) {
    products.push(...(await getProducts(ctx.message.reply_to_message)))
  }
  await Promise.all([...new Set(products)].map((code) => handle(ctx, code)))
})

bot.command('/find', async (ctx) => {
  const products = await search(getKeyword(ctx.message))
  if (!products?.[0]) throw new Error('Not Found')
  return handle(ctx, products[0].code)
})

export default bot

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
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
  const caption = lines.join('\n')
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_markup,
    reply_to_message_id: ctx.message?.message_id,
  }
  if (ctx.chat?.type === 'private') {
    if (product.productImages?.length) {
      const photos: InputMediaPhoto[] = product.productImages.map((media) => ({ type: 'photo', media }))
      await ctx.replyWithMediaGroup(photos, extra)
    }
    if (product.pdfUrl) {
      await ctx.replyWithDocument(product.pdfUrl, { caption, ...extra })
    } else {
      await ctx.reply(caption, extra)
    }
  } else if (product.productImages[0]) {
    await ctx.replyWithPhoto(product.productImages[0], { caption, ...extra })
  } else {
    await ctx.reply(caption, extra)
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

function getProductCodeList(text: string) {
  return Array.from(text.matchAll(/C\d+/gi)).map((match) => match[0])
}

function* getURLs({ text, entities }: Message.TextMessage) {
  for (const entity of entities ?? []) {
    if (entity.type !== 'url') continue
    yield text.slice(entity.offset, entity.offset + entity.length)
  }
}

async function getProducts(message: Message.TextMessage) {
  const products: string[] = getProductCodeList(message.text)
  for (const url of getURLs(message)) {
    const code = await getProductCodeFromURL(url)
    if (code) products.push(code)
  }
  return [...new Set(products)]
}
