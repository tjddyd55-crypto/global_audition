import { useEffect, useState } from 'react'
import * as Updates from 'expo-updates'

/**
 * OTA(EAS Update) 관측·적용의 단일 진입점.
 *
 * 정책(의도적으로 고정된 결정)
 * - 체크 시점: 앱 '부팅 시'에 네이티브가 자동 수행
 *   (app.config.ts의 updates.checkAutomatically=ON_LOAD).
 *   JS 쪽에서는 결과 상태만 관측하고 별도의 명령형 호출을 하지 않는다.
 * - 다운로드 완료 후 적용 방식: '사용자 확인 모달'로 결정을 위임한다.
 *   - "지금 업데이트" → 즉시 reload 하여 새 번들로 재기동
 *   - "나중에" → 이번 세션에서는 모달을 다시 띄우지 않음.
 *     그래도 '다음 앱 부팅' 시 네이티브가 자동 적용하므로 업데이트가
 *     영원히 미뤄지지는 않는다(안전장치).
 * - 실패 처리: OTA 체크/다운로드 실패가 앱 사용을 막지 않아야 한다.
 *   모든 에러는 console.warn으로만 기록하고 삼킨다. (네트워크 오프라인,
 *   CDN 장애, 잘못된 채널 등)
 *
 * 왜 이 모듈에 몰아두었나
 * - "언제 체크하고, 어떻게 적용할지"는 제품 정책이다. 이 정책이 6개월 뒤
 *   바뀐다고 해도(예: 강제 업데이트 모드, 스마트 타이밍 적용 등) 수정 지점이
 *   이 파일 하나가 되도록 설계했다. 외부에서는 expo-updates를 직접 import하지
 *   말 것.
 */

type LogType = 'state' | 'available' | 'downloading' | 'pending' | 'error'

const log = (type: LogType, message: string) => {
  if (__DEV__) console.log(`[OTA] ${type}: ${message}`)
}

/**
 * OTA 상태를 관측하며 디버그 로그만 남긴다.
 * UI를 만지지 않으므로 루트 어디서 호출해도 안전하다.
 */
export function useOtaWatcher(): void {
  const {
    isUpdateAvailable,
    isDownloading,
    isUpdatePending,
    checkError,
    downloadError,
  } = Updates.useUpdates()

  useEffect(() => {
    if (__DEV__) return
    if (!Updates.isEnabled) return

    if (isUpdateAvailable) log('available', '서버에 새 업데이트가 있음')
    if (isDownloading) log('downloading', '새 번들 다운로드 중')
    if (isUpdatePending) log('pending', '새 번들 다운로드 완료')
    if (checkError) log('error', `체크 실패: ${checkError.message}`)
    if (downloadError) log('error', `다운로드 실패: ${downloadError.message}`)
  }, [isUpdateAvailable, isDownloading, isUpdatePending, checkError, downloadError])
}

export type OtaPromptState = {
  /** 업데이트 프롬프트를 지금 표시해야 하는가 */
  shouldShow: boolean
  /** 사용자가 '지금 업데이트'를 눌렀을 때 호출. 앱이 곧 재시작된다. */
  applyNow: () => Promise<void>
  /** 사용자가 '나중에'를 눌렀을 때 호출. 이번 세션에선 다시 뜨지 않는다. */
  dismiss: () => void
}

/**
 * '업데이트 가능' 모달의 표시 여부와 액션을 반환한다.
 *
 * 가시 조건(모두 만족해야 표시)
 *   1) 프로덕션 런타임(__DEV__ false)
 *   2) expo-updates가 활성 상태
 *   3) 네이티브가 새 번들 다운로드를 완료해 pending 상태임
 *   4) 사용자가 이번 세션에서 아직 "나중에"로 닫지 않았음
 */
export function useOtaPromptState(): OtaPromptState {
  const { isUpdatePending } = Updates.useUpdates()
  const [isDismissed, setDismissed] = useState(false)

  const shouldShow =
    !__DEV__ && Updates.isEnabled && isUpdatePending && !isDismissed

  return {
    shouldShow,
    applyNow: applyPendingUpdateNow,
    dismiss: () => setDismissed(true),
  }
}

/**
 * 다운로드된 pending 번들을 즉시 적용한다(앱 재시작).
 * 개발 모드·expo-updates 비활성 환경에서는 no-op.
 */
export async function applyPendingUpdateNow(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return
  try {
    await Updates.reloadAsync()
  } catch (err) {
    log('error', `reloadAsync 실패: ${String(err)}`)
  }
}
