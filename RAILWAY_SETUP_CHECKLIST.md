# Railway 배포 체크리스트

## ✅ 필수 작업

### 1. PostgreSQL 서비스 추가
- [ ] Railway 대시보드 접속
- [ ] 프로젝트에서 "+ New" 클릭
- [ ] "Database" → "Add PostgreSQL" 선택
- [ ] PostgreSQL 서비스 생성 확인

### 2. 환경변수 확인 (Backend 서비스)
- [ ] `DATABASE_URL` - PostgreSQL 연결 URL (자동 생성됨)
- [ ] `JWT_SECRET` - JWT 시크릿 키
- [ ] `JWT_EXPIRES_IN` - JWT 만료 시간 (예: 7d)
- [ ] `NODE_ENV` - production
- [ ] `FRONTEND_URL` - 프론트엔드 URL

### 3. Frontend 환경변수 확인
- [ ] `VITE_API_URL` - 백엔드 API URL

### 4. Seed 데이터 추가 (선택사항)

Railway CLI 설치:
```bash
npm i -g @railway/cli
```

Railway 로그인 및 연결:
```bash
railway login
railway link
```

Seed 실행:
```bash
railway run npm run prisma:seed --prefix backend
```

또는 Railway 대시보드에서:
1. Backend 서비스 → "Settings" 탭
2. "Deploy" 섹션의 "Custom Start Command"에 임시로 설정:
   ```
   npm run prisma:seed && npm start
   ```
3. 다시 배포
4. 배포 완료 후 Custom Start Command 제거 (또는 `npm start`로 변경)

## 🔍 문제 해결

### "the URL must start with the protocol postgresql://" 오류

**원인:** PostgreSQL 서비스가 추가되지 않았거나 DATABASE_URL이 설정되지 않음

**해결:**
1. Railway 대시보드에서 PostgreSQL 추가
2. Backend 서비스 → Variables에서 DATABASE_URL 확인
3. 없으면 PostgreSQL 서비스에서 복사해서 추가

### 배포 로그 확인

Railway 대시보드:
1. Backend 서비스 클릭
2. "Deployments" 탭
3. 최신 배포 클릭
4. "View Logs" 확인

### 데이터베이스 연결 확인

Railway CLI:
```bash
railway run npx prisma studio --prefix backend
```

## 📊 현재 설정

### 데이터베이스
- **Provider:** PostgreSQL
- **로컬 개발:** Docker Compose (localhost:5432)
- **프로덕션:** Railway PostgreSQL

### Seed 계정
- **관리자:** admin@tms.com / admin123!
- **테스트 계정:** test1-5@tms.com / test123!

## 🎯 배포 후 확인 사항

- [ ] 백엔드 Health Check 확인: `https://your-backend.railway.app/health`
- [ ] 프론트엔드 접속 확인
- [ ] 로그인 테스트 (admin@tms.com / admin123!)
- [ ] Seed 계정 로그인 테스트
- [ ] 관리자 페이지 접근 확인
- [ ] 테스트 케이스 생성/수정 확인

## 📞 도움말

상세한 가이드: `backend/RAILWAY_POSTGRESQL_SETUP.md`

