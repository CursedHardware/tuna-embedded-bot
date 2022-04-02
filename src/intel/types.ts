export class IntelError extends Error {
  name = 'IntelError'

  constructor(message: string) {
    super(message)
  }
}
