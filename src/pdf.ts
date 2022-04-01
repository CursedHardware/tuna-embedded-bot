import fetch from 'node-fetch'
import tempy from 'tempy'
import fs from 'fs/promises'
import { spawn } from 'child_process'

export async function getPDFCover(url: string) {
  const response = await fetch(url)
  const content = Buffer.from(await response.arrayBuffer())
  const inputFile = await tempy.write(content, { extension: '.pdf' })
  const outputFile = tempy.file({ extension: '.png' })
  // prettier-ignore
  await exec(
    'gs',
    '-q',
    '-o',
    outputFile,
    '-sDEVICE=pngalpha',
    '-dLastPage=1',
    '-dUseCropBox',
    inputFile,
  )
  return fs.readFile(outputFile)
}

function exec(...commands: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(commands[0], commands.slice(1))
    p.on('close', resolve)
    p.on('error', reject)
    p.on('exit', () => {
      const code = p.exitCode ?? 0
      if (p.exitCode === 0) {
        resolve()
      } else {
        reject(new ExitError(code))
      }
    })
  })
}

class ExitError extends Error {
  constructor(code: number) {
    super(`exit code: ${code}`)
  }
}
