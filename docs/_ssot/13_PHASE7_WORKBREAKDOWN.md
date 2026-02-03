# Phase 7 상세 실행 계획(SSOT)

Phase 7의 목표는 **운영 알림/모니터링 + 감사 로그 자동화**를 구축하는 것이다.

## 범위
- 운영 알림(관리자용) 저장/조회
- 관리자 요청 자동 감사 로그 기록

## 비범위
- 외부 알림 시스템 연동(Slack/PagerDuty)
- 분산 트레이싱/고급 APM

## 작업 스트림

### 1) 운영 알림
#### 목표
- 관리자용 알림을 저장/조회/확인 처리

#### 작업 항목
- `SystemNotification` 모델/상태 정의(NEW/ACKED)
- 알림 생성/조회/확인 API

#### 완료 조건
- 운영 알림을 생성하고 확인 처리 가능

---

### 2) 감사 로그 자동화
#### 목표
- 관리자 요청을 자동 기록

#### 작업 항목
- 관리자 엔드포인트 인터셉터로 로그 자동 저장
- 감사 로그 테이블에 기록

#### 완료 조건
- 관리자 요청 발생 시 감사 로그가 자동 생성

---

## 현재 구현(최소)
- 테이블: `system_notifications`
- API:
  - `POST /api/v1/admin/notifications`
  - `GET /api/v1/admin/notifications`
  - `POST /api/v1/admin/notifications/{id}/ack`
- 관리자 요청 자동 감사 로그 기록(user-service)
