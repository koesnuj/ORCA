# TMS - Test Management System

TestRail을 대체하는 자체 구축형 테스트 케이스 관리 시스템입니다.

## 🎯 프로젝트 구성

이 저장소는 세 가지 독립적인 프로젝트로 구성되어 있습니다:

```
TMS/
├── backend/          # Express + TypeScript 백엔드 (인증 API)
├── frontend/         # React + Vite 프론트엔드 (인증 UI)
└── tms/              # Next.js 기반 메인 TMS 애플리케이션
```

---

## 🚀 빠른 시작

### 1. 인증 시스템 (백엔드 + 프론트엔드)

최신 구현된 Express 백엔드와 React 프론트엔드 기반 인증 시스템입니다.

#### 백엔드 실행

```bash
cd backend
npm install
cp env.example .env
# .env 파일을 열어 DATABASE_URL 설정
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

서버: `http://localhost:3001`

#### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

서버: `http://localhost:5173`

### 2. 기존 TMS 시스템 (Next.js)

```bash
cd tms
npm install
npm run dev
```

서버: `http://localhost:3000`

---

## 📚 문서

### 인증 시스템 문서
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 설치 및 실행 가이드
- **[AUTH_IMPLEMENTATION_GUIDE.md](./AUTH_IMPLEMENTATION_GUIDE.md)** - 구현 상세 가이드
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 프로젝트 전체 요약
- **[backend/README.md](./backend/README.md)** - 백엔드 API 문서
- **[frontend/README.md](./frontend/README.md)** - 프론트엔드 가이드

### 메인 TMS 문서
- **[tms/DEV_LOG.md](./tms/DEV_LOG.md)** - 개발 로그 및 기술 문서
- **[tms/CONVERSATION_LOG.md](./tms/CONVERSATION_LOG.md)** - 대화 로그

---

## 🔑 주요 기능

### 인증 시스템 (backend + frontend)

- ✅ 회원가입 / 로그인
- ✅ JWT 기반 인증
- ✅ 역할 기반 권한 관리 (ADMIN / USER)
- ✅ 관리자 승인 시스템 (PENDING / ACTIVE / REJECTED)
- ✅ 비밀번호 초기화
- ✅ 보호된 라우트

### 메인 TMS 시스템 (tms)

- ✅ 프로젝트 관리
- ✅ 테스트 스위트 / 섹션 관리 (계층형 구조)
- ✅ 테스트 케이스 CRUD
- ✅ 테스트 실행 및 결과 관리
- ✅ Excel Import/Export
- ✅ E2E 테스트 (Playwright)

---

## 🛠️ 기술 스택

### 인증 시스템

**백엔드**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt

**프론트엔드**
- React 18
- TypeScript
- Vite
- React Router v6
- Axios
- Context API

### 메인 TMS

- Next.js 14.2.16 (App Router)
- Prisma 5.12.0
- SQLite
- Tailwind CSS
- Shadcn UI
- Playwright (E2E)

---

## 📖 API 엔드포인트 (인증 시스템)

### 공개 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 인증 필요
- `GET /api/auth/me` - 현재 사용자 정보

### 관리자 전용
- `GET /api/admin/pending-users` - 가입 대기자 조회
- `GET /api/admin/users` - 전체 사용자 조회
- `PATCH /api/admin/users/approve` - 사용자 승인/거절
- `POST /api/admin/users/reset-password` - 비밀번호 초기화

자세한 API 문서는 `backend/API_TEST.http` 파일을 참고하세요.

---

## 🔒 보안

- bcrypt를 사용한 안전한 비밀번호 해싱
- JWT 기반 토큰 인증 (만료 시간: 7일)
- CORS 설정으로 허용된 origin만 접근
- 관리자 API는 이중 검증 (인증 + 역할 체크)
- 환경 변수로 민감 정보 관리

---

## 📝 개발 로그

### 2025-11-27: Express 백엔드 분리

기존 Next.js Server Actions 기반 인증을 독립적인 Express 백엔드로 분리했습니다.

**변경 사항**:
- Express + TypeScript 백엔드 구축
- React + Vite 프론트엔드 구축
- RESTful API 설계
- JWT 기반 인증 구현
- Role-based 권한 관리

자세한 내용은 `tms/DEV_LOG.md`를 참고하세요.

---

## 🧪 테스트

### 백엔드 API 테스트

`backend/API_TEST.http` 파일을 VSCode REST Client 확장으로 실행하거나, Postman/Insomnia를 사용하세요.

### E2E 테스트 (메인 TMS)

```bash
cd tms
npx playwright test
```

---

## 🤝 기여

이 프로젝트는 개인 프로젝트이지만, 버그 리포트나 기능 제안은 언제나 환영합니다!

---

## 📞 문제 해결

### 백엔드 서버가 시작되지 않는 경우
- PostgreSQL 실행 상태 확인
- `.env` 파일 설정 확인
- 포트 충돌 확인 (3001)

### 프론트엔드가 백엔드에 연결되지 않는 경우
- 백엔드 서버 실행 확인
- CORS 설정 확인
- Axios baseURL 확인

### 데이터베이스 마이그레이션 오류
```bash
cd backend
npx prisma migrate reset
npm run prisma:migrate
```

---

## 📜 라이선스

MIT License

---

## 👨‍💻 개발자

**프로젝트 시작**: 2025년 11월
**개발 환경**: Next.js 14 + Express + React

---

## 🎯 로드맵

### 완료 ✅
- [x] 인증 시스템 구축
- [x] 권한 관리
- [x] 사용자 승인 시스템
- [x] Express 백엔드 분리

### 진행 중 🔄
- [ ] Refresh Token 구현
- [ ] 이메일 인증
- [ ] 비밀번호 찾기

### 계획 📅
- [ ] 2단계 인증 (2FA)
- [ ] 감사 로그
- [ ] 역할 세분화 (QA, Viewer 등)

---

**Happy Testing! 🚀**

