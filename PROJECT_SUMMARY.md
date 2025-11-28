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
- [x] **3-컬럼 실행 인터페이스**:
  - 좌측: Test Runs 목록 + 스택형 프로그레스바
  - 중앙: Summary (도넛 차트) + Test Cases 테이블
  - 우측: Test Case Details (선택 시 열림, 화면 고정)
- [x] **핵심 기능**:
  - 5가지 상태 (Pass/Fail/Block/In Progress/Not Run)
  - **다색 도넛 차트**: 상태별 비율 시각화 (SVG Path 기반)
  - **Bulk Select & Edit**: 체크박스 선택 + Assignee/Status 일괄 변경
  - **Smart Comment**: URL 자동 링크 변환
  - **독립적 스크롤**: 좌측/중앙은 함께, 우측은 고정
  - 실시간 진행률 자동 업데이트

### D. UI/UX (Design) - 2025-11-28 리디자인 완료
- [x] **전문적인 SaaS UI 구현**: 
  - TestRail 스타일의 좌측 사이드바 네비게이션
  - Slate + Indigo 컬러 팔레트 (깔끔하고 현대적)
  - 재사용 가능한 UI 컴포넌트 시스템 구축 (Button, Card, Badge, Input)
- [x] **고급 시각화 컴포넌트**:
  - 다색 도넛 차트 (MultiColorDonutChart) - SVG Path 기반
  - 스택형 프로그레스바 (StackedProgressBar) - 5가지 상태 색상 구분
  - 상태 범례 (RunStatusLegend) - 고정 순서 + 퍼센트 표시
  - Summary 섹션 (RunSummary) - 도넛 차트 + Team/Details 탭
- [x] **3-컬럼 레이아웃**:
  - Flexbox 기반 유연한 구조 (`flex-1`, `flex-shrink-0`, `min-h-0`)
  - 독립적 스크롤 (좌측/중앙 함께, 우측 고정 `sticky top-0`)
  - 스크롤 구조 개선 (이중 스크롤바 제거)
- [x] **모든 페이지 리디자인**:
  - 로그인/회원가입: 중앙 정렬 카드 레이아웃
  - 테스트 케이스: 폴더 트리 + 테이블 뷰
  - 플랜 관리: 다색 도넛 차트 + 스택형 프로그레스바
  - 플랜 실행: 3-컬럼 + Bulk Select/Edit
  - 관리자: 사용자 관리 테이블 및 승인 시스템
- [x] Lucide React 아이콘으로 통일성 확보
- [x] 반응형 디자인 (`max-w-[1600px]`, `max-w-[1800px]`)
- [x] **8개의 상세 가이드 문서** (총 2,500+ 줄)

---

## 4. 📝 최근 작업 로그 (Last Session)

**날짜**: 2025-11-28
**작업 내용**: UI/UX 전면 리디자인 + 3-컬럼 레이아웃 + Bulk Select/Edit 기능 추가

### 주요 변경사항
1. **디자인 시스템 구축**
   - 재사용 가능한 UI 컴포넌트 라이브러리 생성
   - `Button`, `Card`, `Badge`, `Input` 컴포넌트 구현
   - 5가지 버튼 변형, 6가지 Badge 색상 지원

2. **레이아웃 전환**
   - 상단 네비게이션 → 좌측 사이드바 구조로 변경
   - `Sidebar.tsx`, `Header.tsx`, `Layout.tsx` 신규 생성
   - 프로젝트/시스템 섹션 분리된 네비게이션

3. **3-컬럼 레이아웃 구현**
   - `PlanDetailPage3Column.tsx`: 좌측(Test Runs) + 중앙(Summary + Table) + 우측(Details)
   - `TestCaseDetailColumn.tsx`: 우측 디테일 패널 (화면 고정, 독립 스크롤)
   - Flexbox 기반 유연한 구조 (`flex-1`, `flex-shrink-0`, `min-h-0`)
   - 스크롤 구조 개선 (Summary 고정 + Table만 스크롤)

4. **고급 시각화 구현**
   - `MultiColorDonutChart.tsx`: SVG Path 기반 다색 도넛 차트
   - `StackedProgressBar.tsx`: 상태별 누적 막대 (5가지 색상)
   - `RunStatusLegend.tsx`: 상태 범례 (Passed → In Progress → Failed → Blocked → Not Run)
   - `RunSummary.tsx`: 도넛 차트 + Team/Details 탭 통합

5. **Bulk Select/Edit 기능**
   - 체크박스 선택 (전체 선택/해제 지원)
   - Bulk Actions Bar (Assignee/Status 일괄 변경)
   - `bulkUpdatePlanItems()` API 통합
   - Summary & 프로그레스바 자동 업데이트

6. **페이지 마이그레이션 (7개 페이지 전체)**
   - `TestCasesPage`: 폴더 트리 + 테이블 UI 개선
   - `PlansPage`: 스택형 프로그레스바 적용
   - `CreatePlanPage`: 플랜 관리 UI 개선 (`max-w-[1600px]`)
   - `PlanDetailPage3Column`: 3-컬럼 + Bulk Edit (`max-w-[1800px]`)
   - `AdminPage`: 사용자 관리 테이블
   - `LoginPage`, `RegisterPage`: 인증 페이지 재디자인

7. **기술적 개선**
   - Tailwind CSS 버전 이슈 해결 (v4 → v3.4.1)
   - lucide-react 아이콘 패키지 통합
   - 일관된 색상 체계 (Passed: green, In Progress: yellow, Failed: red, Blocked: dark gray, Not Run: light gray)
   - 8개의 상세 가이드 문서 생성 (총 2,500+ 줄)

8. **Git 커밋**
   - 51개 파일 변경 (6,957줄 추가, 768줄 삭제)
   - 커밋 해시: `bcb2390`
   - 메시지: "feat: UI/UX 전면 개편 및 Bulk Select/Edit 기능 추가"

9. **기능 개선 및 데이터 무결성 강화 (2025-11-28 추가)**
   - **Test Run 테이블 인라인 수정**: 상세 패널을 열지 않고 테이블에서 직접 Assignee/Status 변경 가능 (Badge 스타일 드롭다운)
   - **데이터 동기화 강화**: 프로필 이름 변경 시 기존 테스트 실행 이력의 담당자 이름도 자동 업데이트 (백엔드 트랜잭션)
   - **실시간 반영**: 인라인 수정 시 모든 시각화 지표(차트, 프로그레스바, 요약 통계) 즉시 갱신
   - **설정 페이지 개선**: 프로필 변경 시 새로고침 없이 즉시 반영되도록 상태 관리 로직 최적화

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

### 프로젝트 문서
- **README**: `README.md` - 프로젝트 개요 및 빠른 시작
- **상세 가이드**: `SETUP_GUIDE.md` - 초기 설치 및 설정 방법
- **진행 로그**: `project_progress.log` - 개발 히스토리 및 타임라인
- **포트폴리오**: `PORTFOLIO.md` - 프로젝트 소개 및 주요 성과

### 기술 가이드 (frontend/)
1. **LAYOUT_GUIDE.md** - 반응형 레이아웃 구조 및 max-width 설정
2. **THREE_COLUMN_LAYOUT_GUIDE.md** - 3-컬럼 레이아웃 초기 구현
3. **THREE_COLUMN_RESPONSIVE_GUIDE.md** - 3-컬럼 최적화 및 Flexbox 구조
4. **FIXED_RIGHT_PANEL_LAYOUT_GUIDE.md** - 우측 패널 고정 및 독립 스크롤
5. **DONUT_CHART_REDESIGN_GUIDE.md** - 단일 색상 도넛 차트 구현
6. **MULTI_COLOR_DONUT_CHART_GUIDE.md** - 다색 도넛 차트 (SVG Path 기반)
7. **STACKED_PROGRESS_BAR_GUIDE.md** - 스택형 프로그레스바 구현
8. **BULK_SELECT_EDIT_GUIDE.md** - Bulk Select/Edit 기능 및 스크롤 개선

**총 8개 가이드, 2,500+ 줄의 상세 문서**
