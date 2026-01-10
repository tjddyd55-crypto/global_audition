# 소셜 로그인 설정 가이드

## 개요

이 플랫폼은 Google, Kakao, Naver, Facebook 소셜 로그인을 지원합니다.

## 백엔드 설정

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id

# Kakao OAuth2
KAKAO_CLIENT_ID=your-kakao-client-id

# Naver OAuth2
NAVER_CLIENT_ID=your-naver-client-id

# Facebook OAuth2
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### 2. 소셜 로그인 제공자 앱 등록

#### Google
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI 추가: `http://localhost:3000/auth/google/callback`

#### Kakao
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 등록
3. "플랫폼" 설정에서 Web 플랫폼 추가
4. "사이트 도메인" 등록: `http://localhost:3000`
5. "Redirect URI" 등록: `http://localhost:3000/auth/kakao/callback`
6. "REST API 키" 복사

#### Naver
1. [Naver Developers](https://developers.naver.com/) 접속
2. 애플리케이션 등록
3. "서비스 URL" 등록: `http://localhost:3000`
4. "Callback URL" 등록: `http://localhost:3000/auth/naver/callback`
5. "Client ID" 및 "Client Secret" 복사

#### Facebook
1. [Facebook Developers](https://developers.facebook.com/) 접속
2. "내 앱" > "앱 만들기" 클릭
3. 앱 유형 선택: "소비자" 또는 "비즈니스"
4. 앱 이름 및 연락처 이메일 입력
5. "앱 설정" > "기본 설정"에서 "앱 ID" 및 "앱 시크릿" 확인
6. "Facebook 로그인" 제품 추가
7. "Facebook 로그인" > "설정"에서 "유효한 OAuth 리디렉션 URI" 추가: `http://localhost:3000/auth/facebook/callback`
8. "앱 도메인" 추가: `localhost`

## 프론트엔드 설정

### 1. 소셜 로그인 SDK 설치

```bash
cd frontend/web
npm install @react-oauth/google react-kakao-login
```

### 2. 소셜 로그인 컴포넌트 구현

각 소셜 로그인 제공자의 SDK를 사용하여 액세스 토큰을 획득한 후, 백엔드 API를 호출합니다.

예시:
```typescript
// Google 로그인
import { GoogleLogin } from '@react-oauth/google'

const handleGoogleLogin = async (credentialResponse: any) => {
  const accessToken = credentialResponse.credential
  await authApi.socialLogin('GOOGLE', accessToken, 'APPLICANT')
}

// Kakao 로그인
import { KakaoLogin } from 'react-kakao-login'

const handleKakaoLogin = async (response: any) => {
  const accessToken = response.access_token
  await authApi.socialLogin('KAKAO', accessToken, 'APPLICANT')
}

// Facebook 로그인
import { FacebookLogin } from 'react-facebook-login'

const handleFacebookLogin = async (response: any) => {
  const accessToken = response.accessToken
  await authApi.socialLogin('FACEBOOK', accessToken, 'APPLICANT')
}
```

## API 엔드포인트

### 소셜 로그인

**POST** `/api/v1/auth/social/login`

**Request Body:**
```json
{
  "provider": "GOOGLE" | "KAKAO" | "NAVER" | "FACEBOOK",
  "accessToken": "소셜 로그인 제공자의 액세스 토큰",
  "userType": "APPLICANT" | "BUSINESS" (선택, 기본값: APPLICANT)
}
```

**Response:**
```json
{
  "token": "JWT 토큰",
  "userId": 1,
  "email": "user@example.com",
  "name": "사용자 이름",
  "userType": "APPLICANT",
  "profileImageUrl": "https://..."
}
```

## 동작 방식

1. 사용자가 소셜 로그인 버튼 클릭
2. 소셜 로그인 제공자의 인증 페이지로 리디렉션
3. 사용자 인증 완료 후 액세스 토큰 획득
4. 백엔드 API에 액세스 토큰 전송
5. 백엔드에서 소셜 로그인 제공자 API를 호출하여 사용자 정보 조회
6. 기존 사용자면 로그인, 신규 사용자면 자동 회원가입 후 로그인
7. JWT 토큰 발급 및 반환

## 주의사항

- 소셜 로그인은 비밀번호 없이 로그인하므로, 비밀번호 필드는 더미 값으로 저장됩니다
- 소셜 로그인으로 가입한 사용자는 비밀번호 변경 기능을 사용할 수 없습니다
- 각 소셜 로그인 제공자의 액세스 토큰 유효 기간에 따라 재로그인이 필요할 수 있습니다
