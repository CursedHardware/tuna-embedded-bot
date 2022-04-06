import { addDays, formatDuration, intervalToDuration } from 'date-fns'
import { Context } from 'telegraf'
import { reply } from '../utils/reply'
import { query } from './graphql'
import { PartResult } from './types'

export async function find(q: string) {
  interface Payload {
    search: { results?: Array<{ part: PartResult }> }
  }
  const part = `part{octopart_url short_description mpn manufacturer_url manufacturer{name}best_datasheet{url}estimated_factory_lead_days}}`
  const { search } = await query<Payload>(`query Query($q:String){search(limit:1,q:$q){results{${part}}}}`, { q })
  return search.results?.map((result) => result.part) ?? []
}

export function handle(ctx: Context, result: PartResult) {
  return reply(ctx, {
    brand: result.manufacturer.name,
    model: result.mpn,
    datasheet: { name: result.best_datasheet?.url },
    *html() {
      yield `Brand: <code>${result.manufacturer.name}</code>`
      if (result.manufacturer_url) {
        yield `Model: <a href="${result.manufacturer_url}">${result.mpn}</a>`
      } else {
        yield `Model: <code>${result.mpn}</code>`
      }
      yield ''
      yield result.short_description
      yield ''
      if (result.estimated_factory_lead_days) {
        const duration = intervalToDuration({
          start: new Date(0),
          end: addDays(0, result.estimated_factory_lead_days),
        })
        const formatted = formatDuration(duration)
        yield `Estimated Factory Lead: ${formatted}`
      }
    },
    links: {
      Octopart: result.octopart_url,
    },
  })
}
