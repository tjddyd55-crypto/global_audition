/*
 * 서비스 워커 - 최소한의 오프라인 셸 + 캐시 전략.
 *
 * 전략 요약:
 * - precache: 오프라인에서도 홈이 깨지지 않도록 manifest와 기본 아이콘만 사전 캐시.
 * - runtime (navigation): network-first. 오프라인이면 캐시된 홈 쉘로 폴백.
 * - runtime (assets): stale-while-revalidate로 빠른 반응성 확보.
 * - API 요청(/api/, 백엔드 도메인)은 SW가 개입하지 않는다. 캐시로 인한 만료 데이터 문제를 피하기 위함.
 *
 * 버전 관리:
 * - CACHE_VERSION을 올리면 구 캐시가 activate 단계에서 일괄 삭제된다.
 */

const CACHE_VERSION = 'v1'
const APP_SHELL_CACHE = `audition-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `audition-runtime-${CACHE_VERSION}`

const APP_SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

function isApiRequest(url) {
  if (url.pathname.startsWith('/api/')) return true
  return url.origin !== self.location.origin
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (isApiRequest(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithShellFallback(request))
    return
  }

  const dest = request.destination
  if (dest === 'image' || dest === 'style' || dest === 'script' || dest === 'font') {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function networkFirstWithShellFallback(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const shell = await caches.match('/')
    return shell ?? Response.error()
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached ?? networkPromise
}
