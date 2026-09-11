import type { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * 이 앱의 역할
 * - applicant-first 네이티브 클라이언트 (Expo Router).
 * - 기존 Spring API/DTO/상태머신을 SSOT로 호출한다. 도메인을 다시 만들지 않는다.
 * - 복잡한 오디션 생성은 웹 폴백(WebView)으로 연다. PC/웹은 삭제하지 않는다.
 *
 * 환경변수
 * - EXPO_PUBLIC_WEB_URL: 웹 폴백 URL + API 프록시 기본 origin.
 * - EXPO_PUBLIC_API_URL: 직접 백엔드 `/api` origin. 비우면 `${WEB_URL}/api`.
 * - EXPO_PUBLIC_ALLOWED_HOSTS: WebView 내부 호스트 목록.
 * - EAS_BUILD_PROFILE: EAS 빌드 프로필 이름.
 */
const DEFAULT_WEB_URL = 'https://frontend-production-8613a.up.railway.app'

export default ({ config }: ConfigContext): ExpoConfig => {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim() || DEFAULT_WEB_URL
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || `${webUrl.replace(/\/+$/, '')}/api`
  const allowedHosts = parseHosts(process.env.EXPO_PUBLIC_ALLOWED_HOSTS, webUrl)

  return {
    ...config,
    name: 'Global Audition',
    slug: 'global-audition',
    scheme: 'globalaudition',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.globalaudition.app',
      infoPlist: {
        NSCameraUsageDescription:
          '오디션 지원 영상을 촬영하기 위해 카메라에 접근합니다.',
        NSMicrophoneUsageDescription:
          '오디션 지원 영상의 오디오를 녹음하기 위해 마이크에 접근합니다.',
        NSPhotoLibraryUsageDescription:
          '갤러리에서 오디션 지원 영상을 선택하기 위해 사진 라이브러리에 접근합니다.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.globalaudition.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: false,
          data: [{ scheme: 'globalaudition', host: 'payments', pathPrefix: '/success' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: false,
          data: [{ scheme: 'globalaudition', host: 'payments', pathPrefix: '/fail' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    // EAS Update(OTA) 구성
    // - url: EAS가 제공하는 이 프로젝트 전용 업데이트 엔드포인트.
    // - checkAutomatically='ON_LOAD': 앱이 켜질 때마다 네이티브 단에서 자동 체크한다.
    //   발견된 업데이트는 백그라운드에서 다운로드되고, '다음 부팅'에 자동 적용된다.
    //   사용자가 업데이트를 느끼지 않게 하려는 의도적 설계이다.
    // - fallbackToCacheTimeout=0: 시작 시 원격 체크로 앱 기동을 지연시키지 않는다.
    //   느린 네트워크/오프라인에서도 즉시 기존 번들로 시작한다.
    // - runtimeVersion.policy='appVersion': 네이티브 버전(1.0.0)이 바뀌면
    //   OTA 호환이 끊긴다. WebView 쉘 앱에서 가장 안전한 기본값이다.
    //   (네이티브 모듈이 바뀌지 않는 한 쉘 JS는 OTA로 밀어넣을 수 있음)
    updates: {
      url: 'https://u.expo.dev/8cde4c16-2ac2-4014-990a-a59048d77496',
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      [
        'expo-image-picker',
        {
          photosPermission: '오디션 지원 참고 영상·프로필 이미지를 선택하기 위해 사진 라이브러리에 접근합니다.',
          cameraPermission: '오디션 지원 참고 영상을 촬영하기 위해 카메라에 접근합니다.',
          microphonePermission: '오디션 지원 영상의 오디오를 녹음하기 위해 마이크에 접근합니다.',
        },
      ],
    ],
    extra: {
      webUrl,
      apiUrl,
      allowedHosts,
      buildProfile: process.env.EAS_BUILD_PROFILE ?? 'local',
      // EAS 프로젝트 연결 식별자. `eas init` 결과를 동적 config(app.config.ts)에
      // 자동 주입할 수 없어 수동으로 박아둔다. 프로젝트를 다시 생성하거나
      // 전환할 때만 교체하면 된다(그 외 상황에서는 건드리지 말 것).
      eas: {
        projectId: '8cde4c16-2ac2-4014-990a-a59048d77496',
      },
    },
  }
}

function parseHosts(raw: string | undefined, fallbackUrl: string): string[] {
  if (raw && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
  try {
    return [new URL(fallbackUrl).host.toLowerCase()]
  } catch {
    return []
  }
}
