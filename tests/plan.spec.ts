import { test, expect } from '@playwright/test';

test('테스트 플랜 생성 및 조회 시나리오 (관리자 승인 포함)', async ({ page }) => {
  test.setTimeout(60000); // 타임아웃 60초로 증가

  const timestamp = Date.now();
  const userEmail = `plan_test_${timestamp}@example.com`;
  const userPassword = 'password123';
  const adminEmail = 'admin@tms.com';
  const adminPassword = 'admin123!';

  // 1. 회원가입 (일반 사용자)
  await page.goto('/register');
  await page.getByTestId('auth-register-name').fill('Plan Tester');
  await page.getByTestId('auth-register-email').fill(userEmail);
  await page.getByTestId('auth-register-password').fill(userPassword);
  await page.getByRole('button', { name: '회원가입' }).click();
  
  // 로그인 페이지 이동 확인 (가입 성공)
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // 2. 관리자 로그인 및 승인 처리
  // 먼저 관리자로 로그인
  await page.goto('/login');
  await page.getByTestId('auth-login-email').fill(adminEmail);
  await page.getByTestId('auth-login-password').fill(adminPassword);
  await page.getByTestId('auth-login-submit').click();
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // 관리자 권한으로 API 호출하여 사용자 승인
  await page.evaluate(async ({ email }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Admin token not found');

    const response = await fetch('/api/admin/users/approve', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, action: 'approve' })
    });
    
    if (!response.ok) throw new Error('Failed to approve user');
  }, { email: userEmail });

  // 관리자 로그아웃
  await page.getByTestId('auth-logout').click();
  await expect(page).toHaveURL(/\/login/);

  // 3. 승인된 사용자로 로그인
  await page.getByTestId('auth-login-email').fill(userEmail);
  await page.getByTestId('auth-login-password').fill(userPassword);
  await page.getByTestId('auth-login-submit').click();
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // 4. 테스트 데이터 생성 (API 사용)
  await page.evaluate(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('User token not found');
    
    // 테스트케이스 2개 생성
    await fetch('/api/testcases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Login Test', priority: 'HIGH' })
    });
    await fetch('/api/testcases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Search Test', priority: 'MEDIUM' })
    });
  });
  
  // 5. 플랜 생성 페이지 이동
  await page.goto('/plans');
  await page.getByText('플랜 생성').click();
  await expect(page).toHaveURL('/plans/create');

  // 6. 플랜 정보 입력
  await page.fill('input[placeholder*="예: 2024"]', `Integration Plan ${timestamp}`);
  
  // 테스트케이스 로딩 대기 및 선택 (전체 선택)
  await page.getByTestId('plan-create-select-all').click();
  
  // 생성 버튼 클릭
  await page.getByTestId('plan-create-submit').click();

  // 7. 목록 페이지 리다이렉트 및 생성 확인
  await expect(page).toHaveURL('/plans');
  await expect(page.getByText(`Integration Plan ${timestamp}`)).toBeVisible();
  
  // 진행률 0% 확인
  const row = page.locator('tr', { hasText: `Integration Plan ${timestamp}` }).first();
  await expect(row.getByText('0%')).toBeVisible();
  
  // 8. 상세 페이지 이동
  await page.getByText(`Integration Plan ${timestamp}`).click();
  await expect(page).toHaveURL(/\/plans\//);
  await expect(page.getByText('Login Test').first()).toBeAttached();
  await expect(page.getByText('NOT RUN').first()).toBeAttached();
  
  console.log('Plan test completed successfully');
});
