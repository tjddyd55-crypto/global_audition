import { headers } from 'next/headers'

const DEVELOPMENT_HOST = 'frontend-develop-3d3e.up.railway.app'

export function GET(request: Request) {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? new URL(request.url).host
  if (host.toLowerCase() !== DEVELOPMENT_HOST) return Response.json([], { status: 404 })
  return Response.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.globalaudition.app',
      sha256_cert_fingerprints: ['2C:A9:07:F4:18:98:DE:B7:CF:FC:00:5F:58:4A:C3:29:B4:5F:DF:BB:26:4B:CA:52:16:A8:2E:C5:1C:70:21:3E'],
    },
  }], { headers: { 'Cache-Control': 'public, max-age=300' } })
}
