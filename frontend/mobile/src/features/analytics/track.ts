/**
 * 분석 이벤트 준비 레이어. 공급자 SDK/키를 넣지 않는다.
 * 이후 변경은 이 파일만 교체하면 된다.
 */
export type AnalyticsEvent =
  | 'audition_list_view'
  | 'audition_detail_view'
  | 'apply_submit'
  | 'vote_cast'
  | 'application_status_view'

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean | null>): void {
  if (__DEV__) {
    console.log('[analytics]', event, props ?? {})
  }
}
