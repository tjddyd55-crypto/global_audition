/**
 * 이 네이티브 쉘 JS 번들의 '쉘 빌드 태그'.
 *
 * 왜 존재하나
 * - 같은 네이티브 앱 버전(app.config.ts의 version) 안에서도 OTA로 JS 번들은 여러 번
 *   교체될 수 있다. 고객/지원/디버그 입장에서 "지금 이 폰에 돌고 있는 쉘이 정확히
 *   어느 번들인지" 구별할 수단이 필요하다. 이 상수가 그 식별자 역할을 한다.
 * - OTA 동작 검증 시에도 '기준점 APK'와 '발행된 OTA 번들'을 눈으로 구별하는 표식으로
 *   이용된다.
 *
 * 어디에 표시되나
 * - WebView 로딩 스피너(renderLoader) 하단에 작은 회색 글씨로. 앱 부팅과 재로드 시마다
 *   잠깐 보이므로 사용자 경험을 해치지 않으면서도 관측 가능하다.
 *
 * 갱신 규칙 (중요)
 * - 쉘 코드(App.tsx, WebViewApp.tsx, OfflineScreen.tsx, OtaUpdatePrompt.tsx,
 *   services/updates.ts 등)에 의미 있는 변경을 커밋할 때마다 bump 한다.
 * - 형식: 'YYYY-MM-DD.N'  (같은 날 여러 번 올리면 N을 증가)
 * - 포매팅/주석/문서만 바꾸는 커밋에서는 bump 하지 않는다.
 * - 네이티브 바이너리가 바뀌는(Expo SDK·네이티브 의존성 추가 등) 커밋에서는
 *   app.config.ts의 version을 올리되, 이 태그도 초기화(예: '2026-05-01.1')한다.
 */
export const SHELL_BUILD_TAG = '2026-04-23.2'
