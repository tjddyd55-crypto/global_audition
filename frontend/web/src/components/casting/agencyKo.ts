/**
 * 기획사 화면은 한국어 전용. 라벨은 ko 카탈로그를 그대로 읽어 정의를 중복하지 않는다.
 */
import ko from '../../../messages/ko.json'

type Dict = Record<string, string>
const casting = ko.casting as unknown as Record<string, Dict | string>
const pick = (group: string, key: string | null | undefined): string => {
  if (!key) return ''
  const table = casting[group]
  return (typeof table === 'object' && table[key]) || key
}

export const koStatus = (s: string) => pick('status', s)
export const koProject = (s: string) => pick('projectType', s)
export const koCompensation = (s: string) => pick('compensationType', s)
export const koDeclineReason = (s: string | null) => pick('declineReason', s)
export const koReportReason = (s: string) => pick('reportReason', s)
export const koField = (s: string | null | undefined) => (s ? (ko.recruitField as Dict)[s] ?? s : '')
export const koCountry = (s: string | null | undefined) => (s ? (ko.nationality as Dict)[s] ?? s : '')
export const koLanguage = (s: string) => (ko.languages as Dict)[s] ?? s
export const koAgeBand = (s: string | null | undefined) => (s ? (ko.channel.ageBand as Dict)[s] ?? s : '')
export const koActor = (s: string) => pick('actor', s)

export const KO_ERRORS: Record<string, string> = {
  AGENCY_NOT_APPROVED: '본사 승인을 받은 기획사만 인재 검색과 캐스팅 제안을 쓸 수 있습니다.',
  CASTING_RESTRICTED: '운영 정책에 따라 이 기획사의 캐스팅 제안이 제한되었습니다. 본사에 문의하세요.',
  TALENT_NOT_ACCEPTING: '이 지원자는 현재 캐스팅 제안을 받을 수 없습니다.',
  CASTING_DAILY_LIMIT: '오늘 보낼 수 있는 제안 수를 모두 썼습니다.',
  OFFER_ALREADY_OPEN: '이 지원자에게 아직 응답 대기 중인 제안이 있습니다.',
  OFFER_MINOR_CONTACT_TEXT: '미성년자에게 보내는 제안에는 URL·이메일·전화번호 등 외부 연락 수단을 넣을 수 없습니다. 플랫폼 안에서만 소통해 주세요.',
  OFFER_EXPIRED: '응답 기한이 지난 제안입니다.',
  OFFER_COOLDOWN: '지원자가 최근 거절해 30일 동안 다시 제안할 수 없습니다.',
  OFFER_PAIR_LIMIT: '같은 지원자에게는 90일에 최대 3건까지 보낼 수 있습니다.',
  OFFER_AUDITION_INVALID: '내 오디션만 연결할 수 있습니다.',
  OFFER_TITLE_REQUIRED: '제목을 입력하세요.',
  OFFER_MESSAGE_REQUIRED: '메시지를 입력하세요.',
  OFFER_TITLE_TOO_LONG: '제목은 120자 이내로 입력하세요.',
  OFFER_MESSAGE_TOO_LONG: '메시지는 2,000자 이내로 입력하세요.',
  OFFER_PROJECT_TYPE_INVALID: '프로젝트 유형을 고르세요.',
  OFFER_FIELD_INVALID: '분야를 고르세요.',
  OFFER_COMPENSATION_INVALID: '보수 유형을 고르세요.',
  OFFER_COUNTRY_INVALID: '활동 국가를 고르세요.',
  OFFER_DEADLINE_INVALID: '응답 기한은 내일부터 30일 이내로 정하세요.',
  OFFER_STATE_CONFLICT: '이미 처리된 제안입니다.',
  OFFER_NOT_FOUND: '제안을 찾을 수 없습니다.',
  TALENT_NOT_FOUND: '지원자를 찾을 수 없습니다.',
}
export const koError = (code: string) => KO_ERRORS[code] ?? '처리하지 못했습니다. 잠시 후 다시 시도하세요.'
