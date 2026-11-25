/** The agency's internal review workspace follows its Korean operating policy. */
export const shortlistCopy = {
  hold: '해당 회차 보류', roundPass: '해당 회차 합격', roundFail: '해당 회차 불합격',
  confirmRoundDecision: (round: number, status: string) => {
    const decision = status === 'APPROVED' ? '합격' : status === 'REJECTED' ? '불합격' : '보류'
    return `${round}차 심사 결과를 ${decision}(으)로 확정하시겠습니까?`
  },
  view: '지원자 보기', all: '전체 지원자', saved: '★ 관심 지원자', people: '명',
  stageHint: (round: number) => `${round ? `${round}차` : '전체 접수'} 관심 목록 · 별표는 내부 검토용이며 합격 대상자 선택과 무관합니다.`,
  loadError: '관심 목록을 불러오지 못했습니다.', nameSearch: '이름 검색', sort: '정렬',
  newest: '최신 접수순', number: '번호순', name: '이름순', score: '평가 점수순',
  selectPage: '현재 페이지 선택', bulk: '관심 일괄 관리', save: '★ 관심 등록', unsave: '☆ 관심 해제',
  select: (name: string) => `${name} 관심 일괄 관리 선택`, pages: '지원자 페이지', previous: '이전', next: '다음',
}
