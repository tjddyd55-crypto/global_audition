import type { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * 이 앱의 역할
 * - 기존 Next.js PWA(web)를 react-native-webview로 감싼 얇은 네이티브 셸이다.
 * - 웹 UI는 그대로 두고 네이티브에서 가치 있는 동작(안드로이드 뒤로가기, 외부 링크, 오프라인
 *   감지, 네이티브 풀-투-리프레시)만 얹어 스토어 심사 통과 수준의 최소 네이티브성을 갖춘다.
 *
 * 환경변수
 * - EXPO_PUBLIC_WEB_URL: 앱이 로드할 웹 URL. 필수.
 * - EXPO_PUBLIC_ALLOWED_HOSTS: 콤마로 구분한 내부 호스트 목록(미지정시 EXPO_PUBLIC_WEB_URL의 host만).
 * - EAS_BUILD_PROFILE: EAS 빌드 프로필 이름(로그/상수용).
 *
 * 이 파일을 TypeScript로 둔 이유는 빌드 시점에 환경변수를 읽어
 * runtime(extra)으로 주입하기 위함이다. 값 자체는 app 코드에서 Constants.expoConfig?.extra를 통해 읽는다.
 */
const DEFAULT_WEB_URL = 'https://global-audition.example.com'

export default ({ config }: ConfigContext): ExpoConfig => {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim() || DEFAULT_WEB_URL
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
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-secure-store'],
    extra: {
      webUrl,
      allowedHosts,
      buildProfile: process.env.EAS_BUILD_PROFILE ?? 'local',
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
