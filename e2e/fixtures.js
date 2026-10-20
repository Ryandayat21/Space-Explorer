import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  consoleAudit: [async ({ page }, use) => {
    const messages = [];
    page.on('pageerror', error => messages.push(error.message));
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) messages.push(`${message.type()}: ${message.text()}`);
    });
    await use();
    expect(messages, 'Browser console must remain free of errors and warnings').toEqual([]);
  }, { auto: true }]
});
export { expect };

export async function chooseObject(page, id) {
  await page.locator('#search-input').fill(id);
  await page.locator(`#search-results [data-object-id="${id}"]`).click();
}
