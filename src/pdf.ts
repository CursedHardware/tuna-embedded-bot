import fs from 'fs/promises'
import tempy from 'tempy'
import { exec } from './utils'

export function isPDF(input: string | undefined | null): input is string {
  if (!input) return false
  return /\.pdf$/i.test(new URL(input).pathname)
}

export async function getPDFCover(content: Buffer) {
  const inputFile = await tempy.write(content, { extension: '.pdf' })
  const outputFile = tempy.file({ extension: '.png' })
  await exec('gs', '-q', '-o', outputFile, '-sDEVICE=pngalpha', '-dLastPage=1', '-dUseCropBox', '-r300', inputFile)
  return fs.readFile(outputFile)
}
