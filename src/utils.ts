import { spawn } from 'child_process'
import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import type { Message, MessageEntity } from 'telegraf/typings/core/types/typegram'
import urlcat from 'urlcat'
import { NoResultError } from './types'

export function isBotCommand({ entities }: Message.TextMessage) {
  const entity = entities?.find((entity) => entity.type === 'bot_command')
  return entity?.offset === 0
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

export function getDatasheetURL(url: string | null | undefined, ...keywords: string[]) {
  if (url && /\.pdf$/i.test(url)) return url
  const query = [...keywords, 'datasheet', 'filetype:pdf']
  return getLuckyURL(query.join(' '))
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
