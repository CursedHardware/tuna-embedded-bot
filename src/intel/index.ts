import { Composer } from 'telegraf'
import { getKeyword } from '../utils'
import { search } from './handler'

export const bot = new Composer()

bot.command('/ark', async (ctx) => {
  const query = getKeyword(ctx.message)
  const results = await search(query)
  const links = results.map((link) => `<a href="https://ark.intel.com/${link.prodUrl}">${link.label}</a>`)
  await ctx.reply(links.join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
    disable_web_page_preview: true,
  })
})
