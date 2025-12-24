import { test, expect } from '@playwright/test';

test('회원가입 및 로그인 시나리오', async ({ page }) => {
  // 1. 회원가입 페이지 이동
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register/);

  // 2. 회원가입 정보 입력
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'password123';
  const name = 'Test User';

  await page.getByTestId('auth-register-name').fill(name);
  await page.getByTestId('auth-register-email').fill(email);
  await page.getByTestId('auth-register-password').fill(password);

  // 가입 버튼 클릭
  await page.getByTestId('auth-register-submit').click();

  // 성공 메시지 확인 (UI 클래스에 의존하지 않고 텍스트로 확인)
  await expect(page.getByText('회원가입', { exact: false })).toBeVisible();

  // 3. 로그인 페이지 리다이렉트 확인 (2초 후 이동)
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // 3.5. 승인 필요(관리자 승인) → 관리자 로그인 후 API로 승인
  await page.getByTestId('auth-login-email').fill('admin@tms.com');
  await page.getByTestId('auth-login-password').fill('admin123!');
  await page.getByTestId('auth-login-submit').click();
  await expect(page).toHaveURL('/', { timeout: 10000 });

  await page.evaluate(async ({ email }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Admin token not found');

    const res = await fetch('/api/admin/users/approve', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, action: 'approve' }),
    });

    if (!res.ok) throw new Error('Failed to approve user');
  }, { email });

  // 관리자 로그아웃 → 로그인 화면으로 이동
  await page.getByTestId('auth-logout').click();
  await expect(page).toHaveURL(/\/login/);

  // 4. 로그인 수행
  await page.getByTestId('auth-login-email').fill(email);
  await page.getByTestId('auth-login-password').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();

  // 5. 로그인 성공 후 홈 이동 확인
  await expect(page).toHaveURL('/', { timeout: 10000 });
});
