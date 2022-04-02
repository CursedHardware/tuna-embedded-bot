import { spawn } from 'child_process'

export function exec(...argv: string[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const p = spawn(argv[0], argv.slice(1))
    setTimeout(() => p.kill(), 60_0000)
    const chunks: Buffer[] = []
    p.stdout.on('data', chunks.push.bind(chunks))
    p.stderr.on('data', chunks.push.bind(chunks))
    p.on('close', resolve)
    p.on('error', reject)
    p.on('exit', () => {
      const data = Buffer.concat(chunks)
      if ((p.exitCode ?? 0) === 0) {
        resolve(data)
      } else {
        reject(new ExecError(argv.join(' '), data.toString('utf-8')))
      }
    })
  })
}

class ExecError extends Error {
  name = 'ExecError'

  public readonly command: string
  public readonly stdout: string

  constructor(command: string, stdout: string) {
    super(stdout)
    this.command = command
    this.stdout = stdout
  }
}
