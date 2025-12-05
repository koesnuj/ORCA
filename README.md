# ORCA

테스트 케이스 관리 시스템

---

## 주요 기능

### 테스트 케이스 관리
- 폴더 구조로 테스트 케이스 분류
- 드래그 앤 드롭으로 이동
- Rich Text Editor 지원

### 테스트 실행 계획(Plan)
- 테스트 선택 및 Plan 생성
- 담당자 할당
- 실행 결과 기록

### 진행률 시각화
- 도넛 차트 및 프로그레스 바
- Pass/Fail/Block 상태 표시

### CSV 지원
- CSV 파일 업로드/다운로드

### 권한 관리
- 관리자 승인 시스템
- 역할 기반 접근 제어

---

## 설치

### 백엔드
```bash
cd backend
npm install
cp env.example .env
# .env 파일 설정 필요
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

실행 주소: `http://localhost:3001`

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

실행 주소: `http://localhost:5173`

---

## 사용법

1. 회원가입 및 관리자 승인 (첫 사용자는 자동 관리자 지정)
2. 로그인
3. 폴더 생성 및 테스트 케이스 작성
4. Plan 생성 및 테스트 실행

---

## 기술 스택

### 백엔드
- Electron 30 (Express + TypeScript)
- Prisma (SQLite)
- JWT

### 프론트엔드
- React 18 (TypeScript)
- Vite
- Tailwind CSS
- Tiptap
- @dnd-kit

---

## 프로젝트 구조
```
TMS_v2/
├── backend/          # Express API 서버
└── frontend/         # React 프론트엔드
```

---

## 라이선스

MIT License
