/** 슈퍼관리자와 한국 국가 관리자 화면의 문구. 다른 관리자 언어는 같은 키로 추가한다. */
export const orgCopy = {
  ko: {
    countries: '국가 조직',
    countryAdmins: '국가 관리자',
    agencies: '글로벌 기획사',
    approval: '기획사 승인',
    contracts: '계약',
    revenue: '매출 통계',
    settlement: '월 정산',
    sales: '글로벌 영업',
    currencyRequired: '기본 통화는 비워 둘 수 없습니다. 요율은 여기서 정하지 않습니다.',
    rateUnset: '국가, 계약 상대, 요율, 시작일, 월 주기, 환불·결제수수료·추가 공제 기준, 지급 통화가 비어 있으면 지급액을 계산하지 않습니다.',
    undecided: '현금 충전과 크레딧 사용은 따로 기록합니다. 유료와 무료 크레딧이 섞인 사용은 배분 정책이 확정되기 전까지 정산에서 보류합니다. 회계 수익 인식과 미사용 크레딧 부채는 전문가 확인이 필요합니다.',
    payoutManual: 'USD 정산을 먼저 확정합니다. 다른 통화 지급은 검증된 환율을 직접 입력해야 하며, 계좌 이체는 실행하지 않습니다.',
    countryOnly: '이 화면은 로그인한 국가 범위만 보여 줍니다.',
  },
} as const

export const adminKo = orgCopy.ko
