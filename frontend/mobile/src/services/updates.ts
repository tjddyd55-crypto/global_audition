import { useEffect } from 'react'
import * as Updates from 'expo-updates'

/**
 * OTA(EAS Update) 관측의 단일 진입점.
 *
 * 정책(의도적으로 고정된 결정)
 * - 체크 시점: 앱 '부팅 시' 네이티브가 자동 수행한다
 *   (app.config.ts의 updates.checkAutomatically=ON_LOAD).
 *   JS 쪽에서는 결과 상태만 관측하고 별도의 명령형 호출을 하지 않는다.
 * - 적용 시점: 새 번들 다운로드가 완료되어도 '즉시 reload 하지 않는다'.
 *   다음 앱 부팅에 네이티브가 자동 적용한다. 사용자가 업데이트를 인지하지
 *   못하도록 하는 '부드러운 OTA' 정책이다. 긴급 강제 적용이 필요해지면
 *   applyPendingUpdateNow()를 이 파일 안에서만 호출하도록 바꾸면 된다.
 * - 실패 처리: OTA 체크/다운로드 실패가 앱 사용을 막지 않아야 한다. 모든 에러는
 *   console.warn으로만 기록하고 삼킨다. (네트워크 오프라인, CDN 장애, 잘못된
 *   채널 등이 해당)
 *
 * 사용 방법
 * - 앱 루트에서 useOtaWatcher()를 한 번 호출하면 끝.
 * - 이 모듈 외부에서 expo-updates를 직접 import하지 말 것.
 *   (정책이 여러 곳에 퍼지면 6개월 뒤 바꾸기 어렵다)
 */

type LogType = 'state' | 'available' | 'downloading' | 'pending' | 'error'

const log = (type: LogType, message: string) => {
  if (__DEV__) console.log(`[OTA] ${type}: ${message}`)
}

/**
 * OTA 상태를 관측한다. 네이티브가 자동 수행하는 체크/다운로드의 결과를
 * React state로 구독해 로그를 남기는 역할만 한다.
 *
 * 개발 모드·expo-updates 비활성 빌드에서는 사실상 no-op이다.
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
    if (isUpdatePending) {
      log('pending', '새 번들 다운로드 완료. 다음 부팅에 자동 적용됨')
    }
    if (checkError) log('error', `체크 실패: ${checkError.message}`)
    if (downloadError) log('error', `다운로드 실패: ${downloadError.message}`)
  }, [isUpdateAvailable, isDownloading, isUpdatePending, checkError, downloadError])
}

/**
 * 긴급 상황 전용: 지금 즉시 pending 업데이트를 적용한다.
 * 현재 호출 지점 없음. '부드러운 OTA' 정책을 '다운로드 즉시 적용'으로 바꾸려면
 * useOtaWatcher의 isUpdatePending 브랜치에서 이 함수를 호출하도록 수정한다.
 */
export async function applyPendingUpdateNow(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return
  try {
    await Updates.reloadAsync()
  } catch (err) {
    log('error', `reloadAsync 실패: ${String(err)}`)
  }
}
