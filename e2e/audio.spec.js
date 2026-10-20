import { test, expect, chooseObject } from './fixtures.js';

test('ambience requires activation, persists only preferences and handles media failure', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page.locator('#audio-panel')).toBeHidden();
  await page.locator('#audio-settings').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#audio-panel')).toBeVisible();
  await expect(page.locator('#audio-play')).toHaveText('Enable Ambience');
  const state = () => page.evaluate(async () => {
    const { getAudioManager } = await import('/src/core/AudioManager.js');
    const manager = getAudioManager();
    return { paused: manager.audio.paused, time: manager.audio.currentTime, state: manager.state };
  });
  expect((await state()).paused).toBe(true);
  await page.locator('#audio-play').focus(); await page.keyboard.press('Enter');
  await expect.poll(async () => (await state()).state).toBe('playing');
  await page.locator('#audio-volume').fill('12');
  await page.locator('#audio-mute').click();
  await expect(page.locator('#audio-mute')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#audio-play').click();
  await expect.poll(async () => (await state()).paused).toBe(true);
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#audio-settings').click();
  await expect(page.locator('#audio-volume')).toHaveValue('12');
  await expect(page.locator('#audio-mute')).toHaveAttribute('aria-pressed', 'true');
  expect((await state()).paused).toBe(true);
  await page.evaluate(async () => {
    const { getAudioManager } = await import('/src/core/AudioManager.js');
    getAudioManager().audio.dispatchEvent(new Event('error'));
  });
  await expect(page.locator('#audio-status')).toContainText('unavailable');
  await expect(page.locator('#audio-play')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#audio-panel')).toBeHidden();
  await chooseObject(page, 'earth');
  await expect(page.locator('#object-name')).toHaveText('Bumi');
});
