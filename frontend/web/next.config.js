const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

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
    // next-intl 플러그인이 요구하는 환경 변수
    _next_intl_trailing_slash: 'never',
    // API URL (Railway에서 설정 필요)
    // Railway → frontend-web → Variables → NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://gateway-production-72d6.up.railway.app',
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
  
  // API 프록시 설정 (개발 환경 전용 - 프로덕션에서는 사용하지 않음)
  async rewrites() {
    // 프로덕션에서는 프록시를 사용하지 않음 (직접 Gateway URL 사용)
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*',
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
