import { spawn } from 'child_process'
import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import fetch from 'node-fetch'
import type { Message, MessageEntity } from 'telegraf/typings/core/types/typegram'
import urlcat from 'urlcat'
import { NoResultError } from './types'
import followRedirects from 'follow-redirects'

export function isBotCommand({ entities }: Message.TextMessage) {
  const entity = entities?.[0]
  return entity?.type === 'bot_command' && entity.offset === 0
}

export function getKeyword({ text, entities }: Message.TextMessage) {
  const entity = entities?.[0]
  if (entity?.type !== 'bot_command') throw new SyntaxError()
  const keyword = text.slice(entity.offset + entity.length).trim()
  if (keyword.length === 0) throw new NoResultError()
  return keyword
}

export function* getEntities({ text, entities }: Message.TextMessage, type: MessageEntity['type']) {
  for (const entity of entities ?? []) {
    if (entity.type !== type) continue
    yield text.slice(entity.offset, entity.offset + entity.length)
  }
}

export function getLuckyURL(query: string) {
  return urlcat('https://duckduckgo.com', { q: `! ${query}` })
}

export async function getDatasheetURL(url: string | null | undefined, brand: string, model: string) {
  if (url && /\.pdf$/i.test(url)) return url
  const query = ['datasheet', 'filetype:pdf']
  if (model.length < 5 || /^\d+$/.test(model)) {
    query.unshift(brand, model)
  } else {
    query.unshift(model)
  }
  const response = await fetch(getLuckyURL(query.join(' ')))
  const html = await response.text()
  const matched = html.match(/'0; url=(?<url>\S+)'/)
  if (!matched?.groups?.url) return
  const parsed = new URL(matched.groups.url, 'https://duckduckgo.com')
  const documentURL = parsed.searchParams.get('uddg')
  if (!documentURL) return
  if (documentURL.startsWith('https://duckduckgo.com')) return
  return getFollowRedirectURL(documentURL)
}

export function toReadableNumber(input: number, base = 1000) {
  if (input === 0) return '0'
  if (input < 1) return input.toFixed(3)
  const units = ['', 'k', 'M', 'G']
  const n = Math.floor(Math.log(input) / Math.log(base))
  const value = input / Math.pow(base, n)
  let formatted = value.toString()
  if (!Number.isInteger(value)) {
    formatted = value.toFixed(1)
  }
  return formatted + units[n]
}

export function formatPrice(input: number) {
  if (input < 3) return input.toFixed(6)
  if (input < 1000) return input.toFixed(2)
  return `${(input / 1000).toFixed(1)}k`
}

export async function download(url: string) {
  const outfile = randomBytes(16).toString('hex')
  await exec('aria2c', '--check-certificate=false', '-j32', '-s32', '--dir=/tmp', `--out=${outfile}`, url)
  return fs.readFile(`/tmp/${outfile}`)
}

export function exec(...commands: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(commands[0], commands.slice(1))
    const stdout: Buffer[] = []
    p.stdout.on('data', (data: Buffer) => stdout.push(data))
    p.stderr.on('data', (data: Buffer) => stdout.push(data))
    p.on('close', resolve)
    p.on('error', reject)
    p.on('exit', () => {
      if (p.exitCode === 0) {
        resolve()
      } else {
        reject(Buffer.concat(stdout).toString('utf-8'))
      }
    })
  })
}

export function getFollowRedirectURL(url: string) {
  const client = url.startsWith('https:') ? followRedirects.https : followRedirects.http
  return new Promise<string>((resolve, reject) => {
    const request = client.request(url, { method: 'HEAD', trackRedirects: true }, (response) => resolve(response.responseUrl))
    request.on('error', reject)
    request.end()
  })
}
