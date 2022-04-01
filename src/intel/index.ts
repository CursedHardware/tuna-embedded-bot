import { Composer } from 'telegraf'
import urlcat from 'urlcat'
import { getKeyword } from '../utils'
import { search } from './handler'

export const bot = new Composer()

bot.command('/ark', async (ctx) => {
  const query = getKeyword(ctx.message)
  const results = await search(query)
  const links = results.map(({ prodUrl, label }) => {
    label = label.replace(/[\xAE\u2122]/g, '')
    const url = new URL(prodUrl, 'https://ark.intel.com')
    if (url.pathname.endsWith('search.html')) {
      url.searchParams.set('q', label)
    }
    return `<a href="${url.toString()}">${label}</a>`
  })
  await ctx.reply(links.join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
    disable_web_page_preview: true,
  })
})
