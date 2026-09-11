# UI 용어 글로서리 (ko / en / mn)

카탈로그 SSOT: `frontend/web/messages/{ko,en,mn}.json`.
Native는 같은 파일을 재사용한다. 별도 JSON 트리를 만들지 않는다.

| Concept | ko | en | mn |
|---|---|---|---|
| Audition | 오디션 | Audition | Аудишн |
| Application | 지원 / 지원서 | Application | Өргөдөл |
| Vote | 투표 | Vote | Санал |
| Round | 라운드 / 차 | Round | Шат |
| Pass | 합격 | Passed | Тэнцсэн |
| Rejected | 불합격 | Rejected | Тэнцээгүй |
| Credit | 크레딧 | Credit | Кредит |
| Payment | 결제 | Payment | Төлбөр |
| Agency | 기획사 | Agency | Агентлаг |
| Applicant | 지망생 / 지원자 | Applicant | Өргөдөл гаргагч |

규칙:
- 몽골어는 음역이 아니라 사용자에게 자연스러운 단어를 쓴다.
- 서버 enum, DB 원문, API payload 는 카탈로그로 강제 번역하지 않는다. UI 라벨만 옮긴다.
- 금액 표시는 정수 USD (`$10` = 10). 센트/float 금지.
