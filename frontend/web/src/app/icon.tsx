import { ImageResponse } from 'next/og'

/**
 * App Router 아이콘 컨벤션: 빌드 시 PNG로 생성돼 /icon 에 서빙된다.
 *
 * SVG manifest만 사용하면 일부 구형 브라우저·일부 OS의 홈 화면 아이콘 대응이 불완전하므로
 * 여기서 동적 PNG도 병행 제공한다.
 */
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'
// ImageResponse는 Edge 런타임에서만 안정적으로 동작한다. Node 프리렌더 경로에서는
// 폰트 URL 해석이 실패하므로 반드시 edge 런타임으로 고정한다.
export const runtime = 'edge'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: -0.5,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          borderRadius: 12,
        }}
      >
        GA
      </div>
    ),
    size,
  )
}
