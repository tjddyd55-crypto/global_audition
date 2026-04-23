const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/**
 * `/api/*` rewrite 대상 백엔드 Origin (트레일링 슬래시 없음).
 * 서버 전용(BACKEND_PROXY_ORIGIN) — 브라우저 번들에 노출되지 않음.
 *
 * 안전 규칙
 * - 환경변수 없이 동작하지 않는다. 과거에는 production URL로 fallback했으나,
 *   develop/staging 환경에서 변수가 누락되면 조용히 프로덕션을 오염시키는 사고가
 *   나기 쉬워 제거한다. 각 Railway 환경은 자신의 BACKEND_PROXY_ORIGIN을 가진다.
 * - 로컬 개발(NODE_ENV=development)에서는 로컬 백엔드를 기본값으로 허용한다.
 */
function backendProxyOrigin() {
  const fromEnv = (process.env.BACKEND_PROXY_ORIGIN || '').trim().replace(/\/+$/, '')
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:8081'
  throw new Error(
    '[next.config.js] BACKEND_PROXY_ORIGIN is not set. ' +
      '각 배포 환경의 Railway Variables에 자신의 백엔드 URL을 등록해야 한다. ' +
      '자동 fallback은 환경 간 데이터 오염을 막기 위해 제거되었다.',
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // ESLint 빌드 중 비활성화 (빌드 안정화)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 빌드 중 타입 체크 비활성화 (빌드 안정화)
  typescript: {
    ignoreBuildErrors: false, // TypeScript 오류는 여전히 체크 (필수)
  },
  
  // Next.js trailing slash 설정 (next-intl과 호환)
  trailingSlash: false,
  
  // 환경 변수 설정 (클라이언트 사이드에서 접근 가능)
  env: {
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE || 'ko',
    _next_intl_trailing_slash: 'never',
  },
  
  // 성능 최적화
  // ⚠️ 주의: removeConsole은 [API Client] 로그는 제거하지 않음 (console.error, console.warn)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? {
          exclude: ['error', 'warn'], // error와 warn은 제거하지 않음 (디버깅용)
        }
      : false,
  },
  
  // Webpack alias 설정 (Railway 빌드 환경 호환)
  webpack: (config, { dev, isServer }) => {
    // alias 설정 추가 (Railway 빌드 환경에서도 작동하도록)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    }
    
    if (dev && !isServer) {
      // 개발 모드에서 빠른 리프레시 최적화
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  /** 브라우저는 항상 동일 Origin `/api/*` 만 호출 → Next가 백엔드로 프록시 (CORS 불필요) */
  async rewrites() {
    const origin = backendProxyOrigin()
    return [
      {
        source: '/api/:path*',
        destination: `${origin}/api/:path*`,
      },
    ]
  },
  
  // 실험적 기능으로 성능 개선
  experimental: {
    optimizePackageImports: ['next-intl'],
  },
}

const finalConfig = withNextIntl(nextConfig)

// next-intl 플러그인 적용 후 env가 누락되는 경우를 방지
finalConfig.env = {
  ...finalConfig.env,
  _next_intl_trailing_slash: 'never',
}

module.exports = finalConfig
