import fetch from 'node-fetch'
import { Composer } from 'telegraf'
import urlcat from 'urlcat'
import { getKeyword } from '../utils'
import { Payload, WareSMDElement } from './types'

const bot = new Composer()

bot.command('/smd', async (ctx) => {
  const reply_to_message_id = ctx.message.message_id
  const searchContent = getKeyword(ctx.message)
  const link = urlcat('https://app-api.xcc.com/search/wareSmd', {
    searchContent,
    pageIndex: 1,
    pageSize: 50,
  })
  const response = await fetch(link)
  const payload: Payload<{ rows: WareSMDElement[] }> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  const { rows } = payload.data
  if (rows.length === 0) throw new Error('Not Found')
  const lines = rows.map((d) => `<pre>${d.smd}: ${d.title}</pre>`)
  await ctx.reply([...new Set(lines)].join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id,
  })
})

bot.command('/pin2pin', async (ctx) => {
  const reply_to_message_id = ctx.message.message_id
  const searchContent = getKeyword(ctx.message)
  const link = urlcat('https://app-api.xcc.com/search/ware-pin', {
    searchContent,
    pageIndex: 1,
    pageSize: 50,
  })
  const response = await fetch(link)
  interface Row {
    level: number
    pinTitle: string
  }
  const payload: Payload<{ pageResult: { rows: Row[] } }> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  const { rows } = payload.data.pageResult
  if (rows.length === 0) throw new Error('Not Found')
  const lines = rows.filter((d) => d.level === 1).map((d) => `<pre>${d.pinTitle.replace(/ /g, '-')}</pre>`)
  lines.sort((a, b) => a.localeCompare(b, 'en-US', { numeric: true }))
  await ctx.reply([...new Set(lines)].join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id,
  })
})

export default bot
