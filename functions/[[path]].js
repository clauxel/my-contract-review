import { handleRequest } from '../worker/index.js'

const CANONICAL_HOSTS = new Set(['contract-review.online', 'www.contract-review.online'])

const legacyResourceRedirects = new Map([
  ['/resources/github', '/ai-contract-review-tool'],
  ['/resources/tools', '/ai-contract-review-tool'],
  ['/resources/open-source', '/free-ai-contract-review'],
  ['/resources/platform', '/legal-contract-review-ai'],
  ['/resources/jobs', '/contract-review-ai-agent'],
  ['/resources/langchain', '/ai-legal-contract-review-template'],
  ['/resources/examples', '/legal-contract-review-example'],
  ['/resources/claude', '/best-ai-contract-review'],
])

function maybeRedirectToHttps(request) {
  const url = new URL(request.url)
  if (url.hostname.endsWith('.pages.dev')) return null

  if (url.protocol !== 'https:' && CANONICAL_HOSTS.has(url.hostname)) {
    url.protocol = 'https:'
    return Response.redirect(url.toString(), 308)
  }
  return null
}

function maybeRedirectLegacyResource(request) {
  const url = new URL(request.url)
  const normalized = url.pathname.replace(/\/+$/, '') || '/'
  const target = legacyResourceRedirects.get(normalized)
  if (!target) return null

  url.pathname = target
  url.search = ''
  return Response.redirect(url.toString(), 301)
}

export function onRequest(context) {
  const url = new URL(context.request.url)
  if (url.pathname.startsWith('/api/')) return handleRequest(context.request, context.env)

  const httpsRedirect = maybeRedirectToHttps(context.request)
  if (httpsRedirect) return httpsRedirect

  const legacyRedirect = maybeRedirectLegacyResource(context.request)
  if (legacyRedirect) return legacyRedirect

  if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
    return handleRequest(context.request, context.env)
  }

  return context.next()
}
