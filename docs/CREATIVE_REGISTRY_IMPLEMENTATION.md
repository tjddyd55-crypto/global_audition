# Creative Registry Extension 구현 완료 보고

## 작업 개요
**작업 ID**: GA_20260202_CREATIVE_REGISTRY_EXTENSION  
**목적**: 창작물(가사/작곡/데모/보컬가이드/AI생성물) 등록 및 오디션 지원 시 참조 기능 추가

## 구현 완료 사항

### 1. Backend (Media Service)

#### 1.1 Creative Asset 엔티티 및 Repository
- **파일**: `CreativeAsset.java`, `CreativeAssetRepository.java`
- **기능**:
  - AssetType 지원 (LYRIC, COMPOSITION, DEMO_AUDIO, VOCAL_GUIDE, STEMS, AI_GENERATED, AI_ASSISTED)
  - 파일 업로드 또는 텍스트 입력 지원
  - SHA-256 해시 자동 생성 (content_hash)
  - 접근 제어 (PUBLIC, AUDITION_ONLY, PRIVATE)
  - declared_creation_type (HUMAN, AI_ASSISTED, AI_GENERATED)
  - Append-only 구조 (수정 불가, 새 버전은 새 레코드)

#### 1.2 Creative Asset Service
- **파일**: `CreativeAssetService.java`
- **기능**:
  - 파일 업로드 시 즉시 해시 생성
  - 텍스트 입력 시 해시 생성
  - 자산 등록/조회/목록 조회
  - asset_id 목록으로 일괄 조회 (오디션 지원 첨부용)

#### 1.3 Creative Asset API
- **파일**: `CreativeAssetController.java`
- **엔드포인트**:
  - `POST /api/v1/vault/assets` - 창작물 등록
  - `GET /api/v1/vault/assets/my` - 내 창작물 목록
  - `GET /api/v1/vault/assets/{id}` - 창작물 상세
  - `POST /api/v1/vault/assets/batch` - asset_id 목록으로 조회

### 2. Backend (Audition Service)

#### 2.1 Application Attachments
- **파일**: `ApplicationAttachment.java`, `ApplicationService.java`
- **기능**:
  - 오디션 지원 시 asset_id 참조 저장
  - 원본 파일 중복 저장 금지 (asset_id만 저장)
  - ApplicationDto에 assetIds 필드 추가

#### 2.2 Expert Feedback (전문가 평가)
- **파일**: `ExpertFeedback.java`, `ExpertFeedbackService.java`, `ExpertFeedbackController.java`
- **기능**:
  - 기획사/인증 평가자만 평가 작성 가능
  - 창작자는 평가 수신/열람 가능
  - 공개/비공개 선택 (isPublic)
  - 증거 패키지 보기 링크 제공 (evidenceLink)
  - 평가 항목: rating (1-5), comment, evidenceLink

### 3. Frontend

#### 3.1 Creative Vault UI
- **파일**: `vault/page.tsx`, `vault/[id]/page.tsx`
- **기능**:
  - 창작물 목록 조회
  - 창작물 등록 (파일 또는 텍스트)
  - 창작물 상세 조회
  - 해시 정보 표시
  - 접근 제어 설정

#### 3.2 오디션 지원 시 Vault 자산 선택
- **파일**: `ApplicationForm.tsx`
- **기능**:
  - Vault에서 자산 선택 UI
  - 선택한 asset_id를 지원서에 첨부
  - 파일 업로드 대신 asset_id 참조

#### 3.3 API 클라이언트
- **파일**: `vault.ts`, `feedback.ts`
- **기능**:
  - Vault API 연동
  - Feedback API 연동

## 데이터베이스 마이그레이션

### Media Service
- `V2__Create_creative_assets.sql`: creative_assets 테이블 생성

### Audition Service
- `V10__Add_asset_ids_to_applications.sql`: application_attachments 테이블 생성
- `V11__Create_expert_feedback.sql`: expert_feedback 테이블 생성

## 핵심 설계 원칙 준수

### ✅ 금지 문구 미사용
- "저작권 보호 보장" ❌
- "법적 효력 보장" ❌
- "원작 판별/독창성 판단" ❌

### ✅ 권장 문구 사용
- "업로드 즉시 존재 확인 기록이 생성됩니다." ✅
- "본 플랫폼은 저작권 등록기관이 아니며, 업로더 선언과 기록을 저장합니다." ✅

### ✅ Append-only 구조
- 수정 불가, 새 버전은 새 레코드로 저장

### ✅ 해시 기반 존재 확인
- SHA-256 해시 자동 생성 및 저장
- 파일 또는 텍스트 모두 해시 생성

### ✅ 접근 제어
- PUBLIC: 기획사/검증된 평가자 열람 가능
- AUDITION_ONLY: 오디션에 첨부한 대상만 열람
- PRIVATE: 본인만 열람

## 테스트 시나리오

### 1. 창작물 등록
1. Vault 페이지 접속
2. "창작물 등록" 클릭
3. 파일 업로드 또는 텍스트 입력
4. AssetType, 접근 제어 설정
5. 등록 완료 → asset_id 발급 확인

### 2. 오디션 지원 시 첨부
1. 오디션 지원 페이지 접속
2. "Vault 열기" 클릭
3. 등록한 창작물 선택
4. 지원서 제출
5. attachments에 asset_id만 저장 확인

### 3. 전문가 평가
1. 기획사 계정으로 로그인
2. 창작물 상세 페이지 접속
3. 평가 작성 (rating, comment, evidenceLink)
4. 공개/비공개 선택
5. 창작자가 평가 확인 가능

### 4. 증거 패키지 보기
1. 평가에 evidenceLink가 있는 경우
2. 링크 클릭하여 증거 패키지 확인
3. (실제 생성은 레지스트리/에스크로 서비스 담당)

## 다음 단계 (MVP 범위 외)
- 거래/라이선스/결제 연계
- 콜라보 요청 (자산 기반)
- 외부 API 연동
