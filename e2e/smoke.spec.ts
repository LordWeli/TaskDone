import { expect, test, type Page } from '@playwright/test';

async function addTask(page: Page, title: string) {
  const input = page.getByRole('textbox', { name: 'New task' });
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByRole('checkbox', { name: title })).toBeVisible();
  await expect(input).toBeFocused();
}

/** Wait until the service worker controls the page, then cut the network. */
async function goOffline(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
    timeout: 15_000,
  });
  await page.context().setOffline(true);
}

for (const offline of [false, true]) {
  test.describe(offline ? 'offline' : 'online', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      if (offline) {
        await goOffline(page);
        await page.reload();
      }
      await expect(page.getByRole('textbox', { name: 'New task' })).toBeVisible();
    });

    test('adds a task with Enter', async ({ page }) => {
      await addTask(page, 'Buy milk');
      await expect(page.getByRole('progressbar', { name: "Today's progress" })).toHaveAttribute(
        'aria-valuetext',
        '0 of 1 tasks done',
      );
    });

    test('completes a task: XP, progress and streak update', async ({ page }) => {
      await addTask(page, 'Walk 30 minutes');
      await page.getByRole('checkbox', { name: 'Walk 30 minutes' }).check();

      await expect(page.getByRole('region', { name: /done/i })).toContainText('Walk 30 minutes');
      await expect(page.getByRole('progressbar', { name: "Today's progress" })).toHaveAttribute(
        'aria-valuetext',
        '1 of 1 tasks done',
      );
      await expect(page.getByRole('progressbar', { name: 'Experience' })).toHaveAttribute(
        'aria-valuetext',
        '10 of 50 XP to level 2',
      );
      await expect(page.getByText('1-day streak')).toBeVisible();
    });

    test('deletes a task and undoes it', async ({ page }) => {
      await addTask(page, 'Pay the bill');
      await page.getByRole('button', { name: 'Delete Pay the bill' }).click();
      await expect(page.getByRole('checkbox', { name: 'Pay the bill' })).toHaveCount(0);

      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByRole('checkbox', { name: 'Pay the bill' })).toBeVisible();
    });

    test('keeps tasks after a reload', async ({ page }) => {
      await addTask(page, 'Read 10 pages');
      await page.reload();
      await expect(page.getByRole('checkbox', { name: 'Read 10 pages' })).toBeVisible();
    });
  });
}
