import axios from 'axios'
import { mapDisplayError } from '@/shared/i18n/mapDisplayError'

type ApplySubmitCopy = {
  alreadyDone: string
  failed: string
}

/** 지원 제출 오류. 403은 mapDisplayError의 상태 매핑을 따르고, 서버 원문은 쓰지 않는다. */
export function mapApplySubmitError(
  err: unknown,
  translate: (key: string) => string,
  copy: ApplySubmitCopy,
): string {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined
  const fallback = status === 409 ? copy.alreadyDone : copy.failed
  return mapDisplayError(err, translate, fallback)
}
