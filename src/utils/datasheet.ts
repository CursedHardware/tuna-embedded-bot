import fs from 'fs/promises'
import _ from 'lodash'
import tempy from 'tempy'
import { exec } from './process'

export function getLuckyURL(...keywords: Array<string | undefined | null>) {
  const url = new URL('https://duckduckgo.com')
  url.searchParams.set('q', ['!', ..._.compact(keywords)].join(' '))
  return url.toString()
}

export function download(url: string) {
  const options = [
    '--check-certificate=false',
    '--max-concurrent-downloads=32',
    '--split=32',
    '--user-agent=Mozilla/5.0',
    '--dir=/',
  ]
  return tempy.file.task(async (outputFile) => {
    await exec('aria2c', ...options, `--out=${outputFile}`, url)
    return fs.readFile(outputFile)
  })
}
