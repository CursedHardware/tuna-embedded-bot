import fetch from 'node-fetch'

export async function query<T>(query: string, variables: unknown) {
  const response = await fetch('https://octopart.com/api/v4/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-agent': 'Mozilla/5.0',
    },
    body: JSON.stringify({ query, variables }),
  })
  const payload: { data: T } = await response.json()
  console.log(payload)
  return payload.data
}
