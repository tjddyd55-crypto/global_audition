const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Next.js trailing slash 설정 (next-intl과 호환)
  trailingSlash: false,
  
  // next-intl 환경 변수 설정
  env: {
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE || 'ko',
    // next-intl 플러그인이 요구하는 환경 변수 (경고 해결)
    _next_intl_trailing_slash: 'never',
  },
  
  // 성능 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 개발 모드 최적화
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // 개발 모드에서 빠른 리프레시 최적화
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    },
  }),
  
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // API 프록시 설정 (개발 환경)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*',
      },
    ];
  },
  
  // 실험적 기능으로 성능 개선
  experimental: {
    optimizePackageImports: ['next-intl'],
  },
}

module.exports = withNextIntl(nextConfig)
