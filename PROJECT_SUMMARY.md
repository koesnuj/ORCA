# 🚀 TMS v2 (Test Management System) 프로젝트 요약

이 문서는 TMS v2 프로젝트의 **실행 방법, 현재 상태, 주요 기능, 기술 스택**을 요약한 문서입니다.
다음 작업자가 이 문서를 통해 프로젝트 컨텍스트를 빠르게 파악하고 개발을 이어갈 수 있도록 작성되었습니다.

---

## 1. 🛠 실행 가이드 (Quick Start)

### 사전 요구사항
- Node.js (v18 이상)
- npm

### 설치 및 실행
1. **저장소 클론 및 의존성 설치**
   ```bash
   git clone https://github.com/koesnuj/TMS_v2.git
   cd TMS_v2
   
   # 백엔드 설정
   cd backend
   npm install
   npm run db:migrate # DB 초기화 (SQLite)
   
   # 프론트엔드 설정 (새 터미널)
   cd ../frontend
   npm install
   ```

2. **서버 실행**
   - **백엔드**: `cd backend && npm run dev` (http://localhost:3001)
   - **프론트엔드**: `cd frontend && npm run dev` (http://localhost:5173 또는 5174)

3. **테스트 계정**
   - **관리자 (Admin)**: 첫 가입자가 자동으로 Admin으로 승인됨
   - 이후 가입자는 Admin의 승인이 필요함 (PENDING 상태)

---

## 2. 🏗 프로젝트 구조 및 기술 스택

### 구조 (Monorepo-like)
```
TMS_v2/
├── backend/           # Express + Prisma (Node.js)
│   ├── src/
│   │   ├── controllers/ # 비즈니스 로직
│   │   ├── routes/      # API 라우팅
│   │   ├── middleware/  # 인증, 권한 체크
│   │   └── utils/       # JWT, Password 유틸
│   ├── prisma/          # DB 스키마 및 SQLite 파일
│   └── tests/           # 백엔드 유닛 테스트 (예정)
│
├── frontend/          # React + Vite (TypeScript)
│   ├── src/
│   │   ├── api/         # API 클라이언트 (Axios)
│   │   ├── components/  # 재사용 컴포넌트
│   │   │   ├── ui/      # 디자인 시스템 (Button, Card, Badge, Input)
│   │   │   ├── Sidebar.tsx, Header.tsx, Layout.tsx
│   │   │   └── FolderTree, Modals
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── context/     # 전역 상태 (Auth)
│   └── index.css        # Tailwind + Global Styles
│
└── tests/             # E2E 테스트 (Playwright)
```

### 기술 스택
- **Frontend**: 
  - React 18, TypeScript, Vite
  - Tailwind CSS v3.4.1 (커스텀 디자인 시스템)
  - Lucide React (아이콘)
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite (Development), PostgreSQL (Production ready)
- **Auth**: JWT (Access Token), Bcrypt
- **Testing**: Playwright (E2E)

---

## 3. ✅ 구현된 주요 기능 (Status)

### A. 인증 (Authentication)
- [x] 회원가입 및 로그인 (JWT)
- [x] 관리자 승인 시스템 (Pending -> Active)
- [x] 역할 기반 접근 제어 (RBAC: Admin / User)

### B. 테스트 케이스 관리 (Test Case Management)
- [x] 계층형 폴더 구조 (무제한 깊이)
- [x] 테스트 케이스 생성/조회 (우선순위, 전제조건 등)
- [x] **CSV Import**: 엑셀/CSV 파일을 통한 대량 등록 기능

### C. 테스트 계획 및 실행 (Test Planning & Execution)
- [x] 테스트 플랜 생성 (케이스 검색 및 선택)
- [x] **실행 인터페이스**:
  - 상태 변경 (Pass/Fail/Block/Not Run)
  - 결과 자동 집계 및 진행률 바 표시
  - **Bulk Update**: 다중 선택 후 일괄 결과 적용
  - **Smart Comment**: URL 자동 링크 변환 기능

### D. UI/UX (Design) - 2025-11-28 리디자인 완료
- [x] **전문적인 SaaS UI 구현**: 
  - TestRail 스타일의 좌측 사이드바 네비게이션
  - Slate + Indigo 컬러 팔레트 (깔끔하고 현대적)
  - 재사용 가능한 UI 컴포넌트 시스템 구축
- [x] **모든 페이지 리디자인**:
  - 로그인/회원가입: 중앙 정렬 카드 레이아웃
  - 테스트 케이스: 폴더 트리 + 테이블 뷰
  - 플랜 관리: 진행률 바 및 상태 시각화
  - 관리자: 사용자 관리 테이블 및 승인 시스템
- [x] Lucide React 아이콘으로 통일성 확보
- [x] 반응형 디자인 (모바일/태블릿 대응)

---

## 4. 📝 최근 작업 로그 (Last Session)

**날짜**: 2025-11-28
**작업 내용**: UI/UX 전면 리디자인 - TestRail 스타일 적용

### 주요 변경사항
1. **디자인 시스템 구축**
   - 재사용 가능한 UI 컴포넌트 라이브러리 생성
   - `Button`, `Card`, `Badge`, `Input` 컴포넌트 구현
   - 5가지 버튼 변형, 6가지 Badge 색상 지원

2. **레이아웃 전환**
   - 상단 네비게이션 → 좌측 사이드바 구조로 변경
   - `Sidebar.tsx`, `Header.tsx`, `Layout.tsx` 신규 생성
   - 프로젝트/시스템 섹션 분리된 네비게이션

3. **페이지 마이그레이션 (7개 페이지 전체)**
   - `TestCasesPage`: 폴더 트리 + 테이블 UI 개선
   - `PlansPage`, `CreatePlanPage`, `PlanDetailPage`: 플랜 관리 UI 개선
   - `AdminPage`: 사용자 관리 테이블 및 비밀번호 재설정 UI
   - `LoginPage`, `RegisterPage`: 인증 페이지 완전 재디자인

4. **기술적 개선**
   - Tailwind CSS 버전 이슈 해결 (v4 → v3.4.1)
   - lucide-react 아이콘 패키지 통합
   - 일관된 색상 체계 및 타이포그래피 적용

---

## 5. 🔜 다음 작업 계획 (Next Steps)

1. **대시보드 (Dashboard)**
   - 홈페이지에 통계 위젯 추가
   - 최근 활동, 플랜 진행 상황 요약

2. **리포팅 (Reporting)**
   - 플랜별 결과 리포트 페이지 구현
   - 파이 차트/바 차트를 활용한 시각화 (Recharts 등 도입 고려)

3. **고급 기능**
   - 테스트 케이스 편집/삭제 기능
   - 플랜 복제 및 재실행
   - 사용자별 할당 및 알림 시스템

4. **CI/CD 파이프라인**
   - GitHub Actions를 이용한 자동 배포 및 테스트 설정

5. **편의성 개선**
   - 테스트 케이스 순서 변경 (Drag & Drop)
   - 이미지 첨부 기능 (현재는 텍스트만 가능)
   - 대규모 데이터를 위한 페이지네이션

---

## 6. 📚 참고 문서
- **상세 가이드**: `SETUP_GUIDE.md` - 초기 설치 및 설정 방법
- **진행 로그**: `project_progress.log` - 개발 히스토리 및 타임라인
- **포트폴리오**: `PORTFOLIO.md` - 프로젝트 소개 및 주요 성과
- **README**: `README.md` - 프로젝트 개요 및 빠른 시작
