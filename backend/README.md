# TMS Backend API

Test Management System의 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: Express + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Password Hashing**: bcrypt

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정합니다.

```bash
cp env.example .env
```

`.env` 파일 예시:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. 데이터베이스 마이그레이션

```bash
npm run prisma:migrate
```

### 4. Prisma Client 생성

```bash
npm run prisma:generate
```

### 5. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 6. 프로덕션 빌드

```bash
npm run build
npm start
```

## API 엔드포인트

### 인증 (Authentication)

#### 회원가입
- **POST** `/api/auth/signup`
- Body: `{ email, password, name }`
- 첫 번째 사용자는 자동으로 ADMIN & ACTIVE 처리

#### 로그인
- **POST** `/api/auth/login`
- Body: `{ email, password }`
- Response: `{ accessToken, user }`

#### 현재 사용자 정보
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### 관리자 (Admin) - 🔒 ADMIN 권한 필요

#### 가입 대기 사용자 목록
- **GET** `/api/admin/pending-users`

#### 모든 사용자 목록
- **GET** `/api/admin/users`

#### 사용자 승인/거절
- **PATCH** `/api/admin/users/approve`
- Body: `{ email, action: "approve" | "reject" }`

#### 사용자 역할 변경
- **PATCH** `/api/admin/users/role`
- Body: `{ email, role: "USER" | "ADMIN" }`

#### 비밀번호 초기화
- **POST** `/api/admin/users/reset-password`
- Body: `{ email, newPassword }`

## 프로젝트 구조

```
backend/
├── src/
│   ├── index.ts              # Express 서버 엔트리
│   ├── routes/
│   │   ├── auth.ts           # 인증 라우트
│   │   └── admin.ts          # 관리자 라우트
│   ├── controllers/
│   │   ├── authController.ts # 인증 컨트롤러
│   │   └── adminController.ts# 관리자 컨트롤러
│   ├── middleware/
│   │   ├── auth.ts           # JWT 검증 미들웨어
│   │   └── roleCheck.ts      # 권한 체크 미들웨어
│   ├── utils/
│   │   ├── jwt.ts            # JWT 유틸리티
│   │   └── password.ts       # 비밀번호 해싱
│   └── lib/
│       └── prisma.ts         # Prisma Client
├── prisma/
│   └── schema.prisma         # DB 스키마
└── package.json
```

## 데이터베이스 스키마

### User 모델

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  status    Status   @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum Status {
  PENDING
  ACTIVE
  REJECTED
}
```

## 보안

- 비밀번호는 bcrypt로 해시화되어 저장
- JWT 토큰은 7일간 유효 (환경 변수로 설정 가능)
- 관리자 전용 API는 role 체크 미들웨어로 보호
- CORS 설정으로 허용된 origin만 접근 가능

## 개발 도구

- **Prisma Studio**: `npm run prisma:studio` - 데이터베이스 GUI
- **Hot Reload**: nodemon으로 코드 변경 시 자동 재시작

