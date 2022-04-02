import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import urlcat from 'urlcat'
import { isPDF } from './pdf'
import { exec } from './process'

export function getLuckyURL(query: string) {
  return urlcat('https://duckduckgo.com', { q: `! ${query}` })
}

export async function getDatasheetURL(url: string | null | undefined, brand: string, model: string) {
  if (isPDF(url)) return url
  const query = ['datasheet', 'filetype:pdf']
  if (model.length < 5 || /^[\d-_]+$/.test(model)) {
    query.unshift(brand, model)
  } else {
    query.unshift(model)
  }
  return getLuckyURL(query.join(' '))
}

export async function download(url: string) {
  try {
    const outfile = randomBytes(16).toString('hex')
    await exec(
      'aria2c',
      '--check-certificate=false',
      '--max-concurrent-downloads=32',
      '--split=32',
      '--user-agent=Mozilla/5.0',
      '--dir=/tmp',
      `--out=${outfile}`,
      url,
    )
    return fs.readFile(`/tmp/${outfile}`)
  } catch {
    return null
  }
}
