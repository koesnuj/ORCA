import { test, expect } from '@playwright/test';

test.describe('Test Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // 1. 회원가입 시도 (계정이 없을 경우를 대비)
    await page.goto('/register');
    await page.fill('input[placeholder="홍길동"]', 'Test User'); 
    await page.fill('input[placeholder="example@email.com"]', 'julim@krafton.com');
    await page.fill('input[placeholder="최소 6자 이상"]', '111111');
    
    try {
      await page.click('button[type="submit"]', { timeout: 2000 });
    } catch (e) {}

    // 2. 로그인 시도
    await page.goto('/login');
    await page.fill('input[type="email"]', 'julim@krafton.com');
    await page.fill('input[type="password"]', '111111');
    await page.click('button[type="submit"]');
    
    // 대시보드 이동 확인 (timeout 넉넉하게)
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Test Cases 페이지로 이동
    await page.click('a[href="/testcases"]');
    await expect(page).toHaveURL('/testcases');
  });

  test('should create folder, create test case, move folder, and delete', async ({ page }) => {
    const folderName = `Folder ${Date.now()}`;
    const caseTitle = `Case ${Date.now()}`;
    const updatedTitle = `${caseTitle} Updated`;

    // 1. 폴더 생성
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept(folderName);
      } else {
        await dialog.accept();
      }
    });

    await page.click('button[title="New Folder"]');
    
    // 폴더 생성 확인 (텍스트로 찾기)
    await expect(page.locator(`text=${folderName}`).first()).toBeVisible();
    
    // 2. 폴더 선택
    await page.click(`text=${folderName}`);
    // 폴더 선택 시 헤더가 "Test Cases"로 바뀜
    await expect(page.locator('h1')).toHaveText('Test Cases'); 

    // 3. 테스트 케이스 생성
    await page.click('button:has-text("Add Case")');
    await expect(page.locator('h2')).toContainText('New Test Case');
    
    await page.fill('input[placeholder="Enter test case title"]', caseTitle);
    
    // Priority 선택 (첫 번째 select)
    await page.locator('select').first().selectOption('HIGH');
    
    // Folder 선택 (자동으로 현재 폴더가 선택되어 있어야 함)
    await page.click('button:has-text("Create Test Case")');
    
    // 생성 확인
    await expect(page.locator('table')).toContainText(caseTitle);
    await expect(page.locator('table')).toContainText('HIGH');

    // 4. 테스트 케이스 수정 (제목 변경 및 폴더 이동)
    const row = page.locator('tr', { hasText: caseTitle });
    await row.locator('button').click(); // More button
    
    await page.click('button:has-text("Edit")');
    await expect(page.locator('h2')).toContainText('Edit Test Case');
    
    await page.fill('input[value="' + caseTitle + '"]', updatedTitle);
    
    // 폴더를 Root로 이동 (두 번째 select)
    await page.locator('select').nth(1).selectOption(''); 
    
    await page.click('button:has-text("Save Changes")');
    
    // 5. 이동 확인 (현재 폴더에서 사라짐)
    await expect(page.locator('table')).not.toContainText(updatedTitle);
    
    // Root로 이동 (새로고침으로 상태 초기화)
    await page.reload();
    await expect(page.locator('h1')).toHaveText('All Test Cases');
    
    // Root 목록에서 확인
    await expect(page.locator('table')).toContainText(updatedTitle);

    // 6. 삭제
    const updatedRow = page.locator('tr', { hasText: updatedTitle });
    await updatedRow.locator('button').click();
    
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Delete Test Case')).toBeVisible();
    
    // 모달 내의 Delete 버튼 클릭
    await page.click('div[role="dialog"] button:has-text("Delete")');

    // 삭제 확인
    await expect(page.locator('table')).not.toContainText(updatedTitle);
  });
});
