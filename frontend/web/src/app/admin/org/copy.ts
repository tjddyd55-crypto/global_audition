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
    rateUnset: '요율·정산 기준·수수료를 비우면 정산은 확인 필요로 남고 지급액을 계산하지 않습니다.',
    undecided: '크레딧 사용의 현금 환산과 소수 USD 반올림은 미정입니다. 두 숫자를 합산하지 않습니다.',
    payoutManual: '지급 기록은 장부 메모입니다. 계좌 이체는 실행하지 않습니다.',
    countryOnly: '이 화면은 로그인한 국가 범위만 보여 줍니다.',
  },
} as const

export const adminKo = orgCopy.ko
