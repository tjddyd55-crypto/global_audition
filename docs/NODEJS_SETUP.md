# Node.js 설치 가이드

## Windows에서 Node.js 설치

### 방법 1: 공식 웹사이트에서 설치 (권장)

1. [Node.js 공식 웹사이트](https://nodejs.org/) 접속
2. **LTS (Long Term Support)** 버전 다운로드 (권장)
3. 다운로드한 `.msi` 파일 실행
4. 설치 마법사 따라하기:
   - "Next" 클릭
   - 라이선스 동의
   - 설치 경로 선택 (기본값 권장)
   - **"Add to PATH" 옵션 체크 확인** (중요!)
   - 설치 완료

5. **PowerShell 또는 명령 프롬프트 재시작**

6. 설치 확인:
   ```powershell
   node --version
   npm --version
   ```

### 방법 2: Chocolatey 사용 (선택)

```powershell
# 관리자 권한으로 PowerShell 실행
choco install nodejs-lts
```

### 방법 3: winget 사용 (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

## 설치 후 확인

PowerShell에서 다음 명령어로 확인:

```powershell
node --version
npm --version
```

정상적으로 설치되었다면 버전 번호가 표시됩니다.

## 문제 해결

### npm이 인식되지 않는 경우

1. **PowerShell 재시작**
   - 현재 PowerShell 창을 닫고 새로 열기

2. **PATH 환경 변수 확인**
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern 'node'
   ```
   Node.js 경로가 표시되어야 합니다.

3. **수동으로 PATH 추가** (필요한 경우)
   ```powershell
   # 사용자 환경 변수에 추가
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\nodejs", "User")
   ```

4. **시스템 재부팅** (최후의 수단)

## 프론트엔드 개발 시작

Node.js 설치 후:

```powershell
cd frontend/web
npm install
npm run dev
```

## 소셜 로그인 SDK 설치 (선택)

Node.js 설치 후 다음 명령어로 소셜 로그인 SDK를 설치할 수 있습니다:

```powershell
cd frontend/web
npm install @react-oauth/google react-kakao-login react-facebook-login
```

## 참고

- Node.js LTS 버전 사용 권장 (안정성)
- npm은 Node.js와 함께 자동 설치됩니다
- 설치 후 반드시 터미널을 재시작하세요
