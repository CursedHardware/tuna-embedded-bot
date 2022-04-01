import { Composer } from 'telegraf'
import type { Message } from 'telegraf/typings/core/types/typegram'
import { group } from '../middlewares'
import { getEntities, isBotCommand } from '../utils'
import { handle } from './handler'
import { getProductCodeFromURL } from './utils'

export const bot = new Composer()

bot.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()
  if (isBotCommand(ctx.message)) throw new SyntaxError()
  const products = await getProducts(ctx.message)
  if (!products.length) return next()
  return Promise.all(products.map((code) => group(ctx, `Reading ${code}`, () => handle(ctx, code))))
})

bot.command('/lc', async (ctx) => {
  const { via_bot, reply_to_message } = ctx.message
  if (via_bot) return
  const products = await getProducts(ctx.message)
  if (reply_to_message && 'text' in reply_to_message) {
    products.push(...(await getProducts(reply_to_message)))
  }
  await Promise.all([...new Set(products)].map((code) => group(ctx, `Reading ${code}`, () => handle(ctx, code))))
})

async function getProducts(message: Message.TextMessage) {
  const products: string[] = getProductCodeList(message.text)
  for (const url of getEntities(message, 'url')) {
    const code = await getProductCodeFromURL(url)
    if (code) products.push(code)
  }
  return [...new Set(products)]
}

function getProductCodeList(text: string) {
  return Array.from(text.matchAll(/\b(C\d+)\b/gi)).map((match) => match[1])
}
