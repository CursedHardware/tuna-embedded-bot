import fs from 'fs/promises'
import tempy from 'tempy'
import { exec } from './process'

export function isPDF(input: string | undefined | null): input is string {
  return !!(input?.length && /\.pdf$/i.test(new URL(input).pathname))
}

export async function getPDFPage(content: Buffer, index = 0) {
  const inputFile = await tempy.write(content, { extension: '.pdf' })
  const outputFile = tempy.file({ extension: '.jpg' })
  await exec(
    'convert',
    '-density',
    '300',
    '-scale',
    '1280x1280',
    '-quality',
    '100%',
    '-background',
    'white',
    '-alpha',
    'remove',
    '-alpha',
    'off',
    `${inputFile}[${index}]`,
    outputFile,
  )
  const output = await fs.readFile(outputFile)
  await fs.rm(inputFile)
  await fs.rm(outputFile)
  return output
}
