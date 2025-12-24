import { test, expect } from '@playwright/test';

test('Plan Execution: Result update, Comment, and Bulk update', async ({ page }) => {
  test.setTimeout(60000); 

  const timestamp = Date.now();
  const adminEmail = 'admin@tms.com';
  const adminPassword = 'admin123!';
  
  // Unique test case titles
  const tcTitle1 = `TC_001_Login_${timestamp}`;
  const tcTitle2 = `TC_002_Search_${timestamp}`;
  const tcTitle3 = `TC_003_Checkout_${timestamp}`;

  console.log('Starting test...');

  // 1. Login as Admin
  await page.goto('/login');
  await page.getByTestId('auth-login-email').fill(adminEmail);
  await page.getByTestId('auth-login-password').fill(adminPassword);
  await page.getByTestId('auth-login-submit').click();
  
  // Wait for login to complete
  await expect(page).toHaveURL('/', { timeout: 10000 });
  console.log('Login successful, current URL:', page.url());

  // Check Token
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  if (!token) {
    throw new Error('Login seemed successful but accessToken is missing');
  }

  // 2. Setup Data (TestCases) via API
  console.log('Creating test cases...');
  await page.evaluate(async ({ token, titles }) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    
    const createTestCase = async (title: string, priority: string) => {
      const res = await fetch('/api/testcases', {
        method: 'POST', headers,
        body: JSON.stringify({ title, priority })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create test case: ${res.status} ${text}`);
      }
      return res.json();
    };

    await createTestCase(titles[0], 'HIGH');
    await createTestCase(titles[1], 'MEDIUM');
    await createTestCase(titles[2], 'LOW');
  }, { token, titles: [tcTitle1, tcTitle2, tcTitle3] });
  console.log('Test cases created.');

  // 3. Create Plan
  console.log('Navigating to /plans');
  await page.goto('/plans');
  
  // Ensure we are on the plans page
  await expect(page.getByRole('heading', { name: '테스트 플랜' })).toBeVisible();

  console.log('Clicking Create Plan');
  await page.getByText('플랜 생성').click();
  await page.fill('input[placeholder*="예: 2024"]', `Execution Plan ${timestamp}`);
  
  // Wait for test cases to load - use the new titles to filter/search if needed, 
  // but here we rely on sorting/list. To be safer, we search for our specific test cases or assume they appear.
  // Given the "Select All" logic, we might select other existing cases too, but that's fine as long as our target cases are included.
  // Ideally, we should search for our unique cases.
  
  await page.getByTestId('plan-create-search').fill(timestamp.toString()); // Filter by timestamp to select only these 3
  
  // Wait for filter to apply
  await page.waitForTimeout(500); 

  // Select All (Filtered)
  await page.getByTestId('plan-create-select-all').click();
  
  await page.getByTestId('plan-create-submit').click();
  console.log('Plan created.');
  
  // 4. Enter Plan Detail
  await expect(page).toHaveURL('/plans');
  await page.getByText(`Execution Plan ${timestamp}`).click();
  await expect(page).toHaveURL(/\/plans\//);
  console.log('Entered plan detail page.');
  
  // Verify initial state
  await expect(page.getByText(tcTitle1)).toHaveCount(1);
  
  // Note: If other test cases exist in the system from previous runs, "Select All" might have picked them up if we didn't filter.
  // But since we filtered by timestamp, only our 3 cases should be in this plan.
  // So 0% progress is correct.
  await expect(page.getByText('0%').first()).toBeVisible(); 

  // 5. Test Individual Update (TC_001 -> PASS)
  // Use .first() just in case, but titles should be unique now.
  const row1 = page.locator('tr', { hasText: tcTitle1 }).first();
  // Result 셀은 커스텀 드롭다운(TableSelect)이므로, "현재 값(NOT RUN)"을 기준으로 클릭하되
  // 값이 바뀐 이후에는 "PASS" 기준으로 다시 찾아 검증한다(기존 locator가 사라지기 때문).
  const resultTriggerBefore = row1.getByRole('button', { name: /NOT RUN/i }).first();
  await resultTriggerBefore.click();
  const dropdown = page.locator('div.absolute.z-50').last();
  await expect(dropdown).toBeVisible();
  await dropdown.getByRole('button', { name: 'PASS' }).click();
  
  const resultTriggerAfter = row1.getByRole('button', { name: /PASS/i }).first();
  await expect(resultTriggerAfter).toBeVisible({ timeout: 15000 });
  await expect(resultTriggerAfter).toHaveClass(/bg-emerald-500/, { timeout: 15000 });
  
  // Progress should be 33% (1/3)
  await expect(page.getByText('33%').first()).toBeVisible();
  console.log('Individual update passed.');

  // 6. Test Comment with Link (TC_001)
  await row1.click(); // open right detail column
  const commentText = 'Tested on https://example.com';
  const commentArea = page.locator('textarea[placeholder*="Add notes"]');
  await commentArea.fill(commentText);
  await commentArea.blur(); // auto-saved on blur
  await expect(row1.locator('svg.lucide-message-square')).toBeVisible();
  console.log('Comment update passed.');

  // 7. Test Bulk Update
  const row2 = page.locator('tr', { hasText: tcTitle2 }).first();
  const row3 = page.locator('tr', { hasText: tcTitle3 }).first();
  
  await row2.locator('input[type="checkbox"]').check();
  await row3.locator('input[type="checkbox"]').check();
  await expect(page.getByText('2개 선택')).toBeVisible();
  await page.getByTestId('plan-bulk-result').selectOption('FAIL');
  await page.getByTestId('plan-bulk-apply').click();
  
  // Wait for bulk update to process
  await page.waitForTimeout(1000);

  const resultTrigger2 = row2.getByRole('button', { name: /FAIL/i }).first();
  const resultTrigger3 = row3.getByRole('button', { name: /FAIL/i }).first();
  await expect(resultTrigger2).toBeVisible();
  await expect(resultTrigger3).toBeVisible();
  
  // Progress should be 100%
  await expect(page.getByText('100%')).toBeVisible();
  console.log('Bulk update passed.');

  console.log('All tests passed.');
});
