import { Composer } from 'telegraf'
import type { Message } from 'telegraf/typings/core/types/typegram'
import { getEntities } from '../utils'
import { handle } from './handler'
import { getProductCodeFromURL } from './utils'

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

export default bot

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
