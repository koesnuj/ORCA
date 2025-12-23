import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('backend health check: GET /health returns expected shape', async ({ request }) => {
    const res = await request.get('http://localhost:3001/health');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      message: 'TMS Backend Server is running',
    });
    expect(typeof body.timestamp).toBe('string');
  });

  test('frontend boot: unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });
});


