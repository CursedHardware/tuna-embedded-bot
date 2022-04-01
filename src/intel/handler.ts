import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { IntelError } from '../types'

const API_URL = 'https://ark.intel.com/libs/apps/intel'

export async function search(input_query: string) {
  const link = urlcat(API_URL, '/arksearch/apigeeautocomplete.json', {
    _charset_: 'UTF-8',
    input_query,
    locale: 'en-US',
    currentPageUrl: 'https://ark.intel.com/content/www/us/en/ark/search.html',
  })
  const response = await fetch(link)
  interface Result {
    label: string
    prodUrl: string
  }
  const results: Result[] = await response.json()
  if (results.length === 0) throw new IntelError('No Result')
  return results
}
