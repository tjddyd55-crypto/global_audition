# JWT_SECRET 운영 적용 절차

이 문서는 절차 제안이다. 핫픽스 PR을 만들지 않았고, Railway production/development 변수와 배포는 바꾸지 않는다. 비밀 값과 저장소에 있던 코드 기본값 원문은 적지 않는다. 그 값은 아래부터 **코드 기본값**이라고만 부른다.

배포 중인 코드는 `main` = `develop` = `3aaf471`이다. PR #66 스택 전체를 `main`에 올리는 방법으로 이 문제를 고치지 않는다.

## 원인

`JWT_SECRET`이 없으면 `app.jwt.secret`이 코드 기본값으로 채워졌다. 서명은 jjwt HMAC(`signWith` / `verifyWith`)이고, 키 길이가 HS256에 충분해 그 기본값으로 서명이 됐다. 토큰에는 `sub`(사용자 UUID), `email`, `role`, `iat`, `exp`만 있고 issuer/audience는 없다. access 만료는 24시간(`expiration-ms` 86400000)이다. 서버가 보관한 refresh token은 없다. `POST /api/auth/session`은 이미 유효한 access 토큰이 있을 때 DB 역할로 access 토큰을 다시 발급한다. 쿠키 `accessToken`의 max-age도 같은 만료를 따른다.

필터는 서명만 맞으면 토큰 안의 `role` claim을 `ROLE_<role>`로 믿었다. 그래서 코드 기본값을 아는 쪽에서 `role=SUPER_ADMIN`인 토큰을 만들면 관리자 API가 통과했다. production과 development가 같은 코드 기본값으로 서명하면 환경 사이 토큰도 서로 통한다.

키 원문은 기동 로그나 API 응답에 찍히지 않았다. 취약점은 로그 유출이 아니라 저장소에 있는 기본값이다.

## main 기준 최소 핫픽스 (제안만, PR 생성 없음)

가능하다. PR #66 전체를 올릴 필요는 없다.

`3aaf471`의 `JwtService`와 `JwtAuthFilter`는 이 수정 전과 블롭이 같았다. JWT 기본값과 `APP_ALLOW_LEGACY_CREDIT_CHARGE:true` 문장도 `application.yml`에 있다. 그 파일의 나머지(번역 설정 등)는 이 브랜치와 다르다. `application.yml` 전체, `CreditService`, Flyway는 핫픽스에 넣지 않는다. 원장 마이그레이션은 없다.

`3aaf471`에는 `SettingsSecretCrypto`, `RecoveryCodeCrypto`, `*IT`, `@SpringBootTest`가 없다. `JWT_SECRET` 문자열은 `backend/src/main/resources/application.yml`에만 있다. 핫픽스는 그 암호 클래스와 통합 테스트를 가져오지 않는다.

`main`에서 분기한 핫픽스에 넣을 최소 변경:

1. `JwtSecretPolicy`, `JwtSecretGuard` 추가. 빈 값, 32바이트 미만, 코드 기본값과 같은 값이면 `IllegalStateException`으로 기동 실패. 예외 문구에 키를 넣지 않는다.
2. `JwtService`가 그 검사를 통과한 값으로만 HMAC 키를 만든다.
3. `JwtAuthFilter`는 서명 검증 후 사용자 id로 DB를 읽고, 권한은 DB `users.role`만 쓴다. 토큰 `role` claim은 무시한다. 사용자가 없으면 인증하지 않는다.
4. `main`의 `application.yml`에서 JWT placeholder 기본값만 비우고, `APP_ALLOW_LEGACY_CREDIT_CHARGE` 기본값만 `false`로 바꾼다. `CreditController`의 `@Value` 기본값도 `false`. 충전 메서드 본문과 원장은 그대로 둔다.
5. 테스트가 컨텍스트를 띄우면 테스트 설정에만 테스트 전용 키를 둔다. `3aaf471` 테스트 소스에는 코드 기본값 대입이 없다.
6. issuer/audience는 넣지 않는다. 환경마다 다른 `JWT_SECRET`이면 교차 인증이 서명 단계에서 거절된다.

## 적용 순서

반드시 변수 먼저, 코드 나중이다.

1. production과 development에 **서로 다른** `JWT_SECRET`을 넣는다. 각각 32바이트 이상이고, 코드 기본값과 같으면 안 된다. 두 환경이 같은 값이면 교차 인증이 그대로다.
2. `APP_ALLOW_LEGACY_CREDIT_CHARGE=false`를 명시한다. 변수를 비워 두어도 핫픽스 코드의 기본값은 false다. `true`로 두지 않는다.
3. 변수를 저장하면 현재 배포(기본값을 쓰던 프로세스)가 재시작될 수 있다. 재시작 후에는 새 키로 서명하므로, 코드 배포 전에도 기존 세션은 죽는다. 이것이 맞는 순서다.
4. 그 다음 핫픽스 코드를 배포한다. 변수가 없거나, 짧거나, 코드 기본값이면 프로세스는 뜨지 않는다. 코드를 먼저 배포하면 변수가 생기기 전까지 기동 실패로 닫히며, 그 공백이 장애가 된다.
5. 배포 후 코드 기본값으로 서명한 관리자 토큰은 401이어야 한다. 확인은 운영 서버에 위조 토큰을 보내는 방식이 아니라, 무토큰 401과 정상 로그인 후 권한 확인으로 한다.

## 세션 무효화

현재 운영 리비전 `3aaf471` 기준:

- 세션 저장소는 없다. access JWT와 `accessToken` 쿠키가 세션이다. 만료는 24시간이다. 키가 바뀌면 기존 access 토큰은 서명 불일치로 401이다.
- 이 리비전의 `POST /api/auth/session`은 없다. 이 브랜치에만 있고, 현재 토큰이 유효할 때만 DB 역할로 access 토큰을 다시 발급한다. 옛 키 토큰으로는 갱신할 수 없다.
- 사용자는 다시 로그인해야 한다. 비밀번호 해시는 JWT 키와 무관하다.
- `3aaf471`에는 복구 코드 pepper와 결제·번역 시크릿 AES-GCM이 없다. 핫픽스만 올릴 때 재입력할 암호문은 없다.
- 이 브랜치(PR #66)에는 `RecoveryCodeCrypto`와 `SettingsSecretCrypto`가 JWT 키에서 키를 만든다. 운영에는 아직 그 코드로 만든 암호문이 없다. 이 브랜치를 코드 기본값으로 먼저 띄운 뒤 키를 바꾸면, 그 사이에 저장된 복구 코드 조회와 결제·번역 암호문은 풀리지 않는다. 변수를 먼저 넣어 그 창을 만들지 않는다. 이미 그렇게 저장됐다면 비밀번호 로그인 후 복구 코드를 다시 발급하고, 관리 화면에서 시크릿을 다시 저장한다. 코드 기본값으로 되돌리지 않는다. 결제 시크릿은 복호화에 실패하면 없는 값으로 보고 주문을 500으로 막지 않는다. MOCK 웹훅 시크릿은 연결 확인 때 현재 키로 다시 만든다. 원장 행은 바꾸지 않는다.
- 역할 claim을 무시하므로, 키가 같아도 권한은 DB `users.role`을 따른다.

## 롤백

- 코드를 이전 커밋으로 되돌려도 `JWT_SECRET` 변수는 그대로 둔다. 이전 코드는 변수가 있으면 그 값으로 서명한다.
- 변수를 지우거나 코드 기본값과 같은 값으로 바꾸는 롤백은 금지다. 그러면 위조가 다시 열린다.
- 운영에 따로 보관된 이전 비밀은 없다. 변수가 비어 코드 기본값을 쓰고 있었기 때문이다. 복원할 이전 운영 키가 없다.
- 크레딧 플래그를 `true`로 되돌려 무결제 충전을 다시 열지 않는다. 원장 행은 롤백 대상으로 수정하지 않는다.

## 레거시 크레딧 충전

`POST /api/credits/charge`는 로그인한 사용자면 `creditService.chargeCredits`로 지갑을 늘렸다. 결제 주문 없이 `credit_transactions` note `SELF_API_CHARGE`다. 잔액은 지원비 등 `useCredits`로 쓸 수 있다. 플래그 기본값이 true인 동안에는 유료 크레딧을 결제 승인 없이 발급할 수 있어 P0다.

웹의 `/credits/charge`는 패키지 결제 화면으로 가고 `POST /credits/prepare-payment`를 쓴다. 모바일도 `POST /credits/prepare-payment`만 호출한다. 레거시 `POST /api/credits/charge`를 부르는 화면은 없다.

기본값을 false로 바꿔도 기존 원장 행은 바꾸지 않는다. 변수가 없으면 해당 API는 403이고 결제 주문 경로만 남는다. 운영에서는 false를 유지한다.
