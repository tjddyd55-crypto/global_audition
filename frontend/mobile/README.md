# Global Audition Mobile (Expo)

Global Audition 네이티브 앱. 기존 Next.js PWA(`frontend/web`)를 **Expo + react-native-webview**로 감싼 얇은 셸이다. 웹 UI는 그대로 유지하면서, 네이티브에서만 가치 있는 동작(안드로이드 물리 뒤로가기, 외부 링크 위임, 오프라인 폴백, 풀-투-리프레시)만 얹었다.

---

## 이 앱이 취한 전략

- **WebView 래퍼**: `frontend/web`에서 이미 빌드한 PWA를 그대로 사용한다. 두 벌의 UI를 유지할 필요가 없다.
- **환경별 URL 주입**: `eas.json`의 각 빌드 프로필이 `EXPO_PUBLIC_WEB_URL`을 주입한다. 앱은 `app.config.ts → extra → src/config/env.ts`로 이를 읽는다.
- **심사 통과용 최소 네이티브**: 순수 WebView 래퍼는 Apple에서 거절될 수 있어, Back 핸들링 / 외부 링크 분리 / 오프라인 화면 / Pull-to-Refresh 정도의 네이티브성을 얹었다.
- **웹과의 연동**: WebView UA에 `GlobalAuditionApp/1.0` 마커를 삽입하고 `frontend/web/src/shared/device/appShell.ts`의 `isInNativeAppShell()`로 감지한다. 앱 안에서는 PWA 설치 프롬프트와 Service Worker 등록이 자동으로 생략된다.

```
frontend/mobile
├─ App.tsx                     # 루트 Provider
├─ app.config.ts               # 앱 메타 + 환경변수 extra 주입
├─ eas.json                    # development / preview / production / production-apk 프로필
├─ index.ts                    # Expo 엔트리포인트
├─ package.json
├─ src
│  ├─ config/env.ts           # WEB_URL, ALLOWED_HOSTS, isInternalUrl()
│  └─ components
│     ├─ WebViewApp.tsx       # 본체(뒤로가기·외부링크·오류·풀리프레시)
│     └─ OfflineScreen.tsx    # 로드 실패 폴백 화면
└─ assets                      # icon / splash / adaptive
```

---

## 1. 로컬 개발

### 선행 조건
- Node.js 20 LTS 이상
- (선택) Android Studio 에뮬레이터 또는 실제 단말 + [Expo Go](https://expo.dev/go) 앱
- (선택) iOS 시뮬레이터는 macOS에서만 가능

### 설치
```powershell
cd frontend/mobile
npm install
npx expo install --fix   # Expo SDK와 정합하는 버전으로 교정
```

### 실행
로컬 `frontend/web`을 3000 포트에서 띄운 뒤,
- Android 에뮬레이터: `http://10.0.2.2:3000`이 호스트 PC의 3000에 매핑된다.
- 실제 단말: 같은 Wi-Fi에 연결한 뒤 PC의 LAN IP(예: `http://192.168.0.23:3000`)를 `.env.local`에 넣는다.

```powershell
# frontend/mobile/.env.local
EXPO_PUBLIC_WEB_URL=http://10.0.2.2:3000
EXPO_PUBLIC_ALLOWED_HOSTS=10.0.2.2,localhost

npx expo start
# 터미널 QR을 Expo Go로 스캔하거나 'a' 키로 Android 에뮬레이터 열기
```

---

## 2. APK 빌드 (EAS Build, 권장)

로컬에 Android SDK / JDK / Gradle을 깔지 않고 **클라우드에서 APK를 받는** 경로다. Windows에서 가장 마찰이 적다.

### 초기 1회 세팅
```powershell
cd frontend/mobile
npm i -g eas-cli           # 이미 설치돼 있으면 건너뜀
eas login                  # Expo 계정 로그인
eas init                   # projectId 생성 및 app.config.ts에 주입
```

### preview(스테이징) APK 빌드
```powershell
# eas.json의 preview 프로필이 EXPO_PUBLIC_WEB_URL=https://staging.global-audition.example.com 을 주입한다.
npm run build:apk:preview
# 빌드가 끝나면 EAS 대시보드에 APK 다운로드 링크가 생성된다.
```

### production APK 빌드 (스토어 업로드 전 내부 배포용)
```powershell
npm run build:apk:production
```

> **주의**: Google Play 스토어에 공식 업로드할 때는 APK가 아니라 **AAB**가 필요하다. `npm run build:aab:production` 참고.

### iOS (참고)
macOS가 없어도 EAS Build로 `.ipa`는 만들 수 있지만, 서명 인증서/프로비저닝 프로파일 설정이 필요하다. 지금은 Android APK만 대상으로 한다.

---

## 3. 로컬 빌드 (선택)

오프라인 환경에서 로컬로 빌드하고 싶다면 `npx expo prebuild`로 `android/` 네이티브 프로젝트를 생성한 뒤 Gradle로 빌드할 수 있다. 단 Windows에서는 아래를 먼저 갖춰야 한다.
- JDK 17
- Android Studio + SDK 34
- `ANDROID_HOME` 환경변수

```powershell
npx expo prebuild --platform android
cd android
./gradlew assembleRelease      # 서명 안 된 디버그성 빌드
# 산출물: android/app/build/outputs/apk/release/app-release.apk
```

---

## 4. 빌드 프로필 일람

`eas.json` 참조.

| 프로필                 | 배포    | 타겟                 | 웹 URL                                         |
| ---------------------- | ------- | -------------------- | ---------------------------------------------- |
| `development`          | internal | APK + dev-client     | `http://10.0.2.2:3000` (에뮬레이터)            |
| `preview`              | internal | APK                  | `https://staging.global-audition.example.com`  |
| `production-apk`       | store   | APK (내부 테스트용) | `https://global-audition.example.com`          |
| `production`           | store   | AAB (Play Store)     | `https://global-audition.example.com`          |

> 실제 서비스 URL이 정해지면 `eas.json`의 `env.EXPO_PUBLIC_WEB_URL`과 `EXPO_PUBLIC_ALLOWED_HOSTS`를 교체한다. 여기 한 곳만 바꾸면 앱 전역이 따라온다.

---

## 5. 스토어 배포 체크리스트 (추후)

- [ ] `app.config.ts`의 `version`과 각 스토어 빌드 번호를 bump
- [ ] 아이콘/스플래시 교체 (`assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`)
- [ ] 개인정보 처리방침 / 서비스 이용약관 URL을 스토어 콘솔에 등록
- [ ] Google Play 내부 테스트 트랙에 `eas submit --platform android` 로 업로드
- [ ] App Store Connect에 `eas submit --platform ios` 로 업로드 (macOS 계정 필요)

---

## 6. 트러블슈팅

- **"의존성 버전이 Expo SDK와 안 맞습니다" 경고**: `npx expo install --fix`로 자동 정합.
- **안드로이드 에뮬레이터에서 localhost가 비어 보임**: `localhost` 대신 `10.0.2.2`를 사용. (실단말은 PC LAN IP + 같은 Wi-Fi.)
- **외부 링크가 WebView 안에서 열림**: `EXPO_PUBLIC_ALLOWED_HOSTS`에 해당 호스트가 과도하게 포함돼 있지 않은지 확인.
- **PWA 설치 프롬프트가 앱 안에서 떠버림**: WebView UA 마커(`GlobalAuditionApp`)가 빠지지 않았는지 확인. `src/components/WebViewApp.tsx`의 `applicationNameForUserAgent`.
