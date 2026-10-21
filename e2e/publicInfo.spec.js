import { test, expect } from './fixtures.js';

test('public identity and credits are accessible without invented deployment metadata', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page).toHaveTitle('Milky Way Observer');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Bima Sakti/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Milky Way Observer');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://space-explorer-kappa-azure.vercel.app/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://space-explorer-kappa-azure.vercel.app/');
  expect(await page.locator('meta[property="og:image"],meta[name="twitter:image"]').count()).toBe(0);
  const icon = await page.request.get(await page.locator('link[rel="icon"]').getAttribute('href'));
  expect(icon.ok()).toBe(true); expect(await icon.text()).toContain('<svg');
  await page.locator('#help-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#close-help')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#about-credits summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#about-credits')).toHaveAttribute('open', '');
  await expect(page.locator('#about-credits')).toContainText('bukan katalog bintang lengkap');
  await expect(page.locator('#about-credits')).toContainText('lisensi dan persyaratan attribution belum diverifikasi');
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toBeVisible();
  await expect(page.locator('#help-button')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#mobile-notice')).toBeVisible();
  await expect(page.locator('#mobile-notice')).toHaveCSS('pointer-events', 'none');
});

test('HTML explains project and JavaScript requirement without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173');
    await expect(page.locator('.project-intro')).toBeVisible();
    await expect(page.locator('noscript')).toBeVisible();
    expect(await page.locator('noscript').textContent()).toContain('JavaScript dan WebGL 2');
    await expect(page.locator('#loading-reload')).toBeVisible();
  } finally { await context.close(); }
});
