export class NoResultError extends Error {
  name = 'NoResultError'

  constructor() {
    super('No Result')
  }
}
