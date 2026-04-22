import { ImageResponse } from 'next/og'

/**
 * iOS 홈 화면 아이콘.
 *
 * iOS Safari는 SVG 아이콘을 홈 화면에 쓸 수 없으므로 반드시 PNG가 필요하다.
 * Next App Router가 본 파일을 빌드 시 180x180 PNG로 변환해 /apple-icon 에 서빙한다.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
// ImageResponse는 Edge 런타임에서만 안정적으로 동작한다. Node 프리렌더 경로에서는
// 폰트 URL 해석이 실패하므로 반드시 edge 런타임으로 고정한다.
export const runtime = 'edge'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>GA</div>
        <div style={{ marginTop: 6, fontSize: 18, opacity: 0.8 }}>Audition</div>
      </div>
    ),
    size,
  )
}
