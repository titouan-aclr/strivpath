import { test, expect } from '../fixtures/auth.fixture';
import { expectUnauthenticated } from '../helpers/auth';

test.describe('E2E Goal Creation', () => {
  test('creates a custom goal and shows it in the list', async ({ authenticatedPage: page, db }) => {
    const goalTitle = 'E2E Run 42km';

    await page.goto('/en/goals/new');
    await page.getByRole('button', { name: /custom goal/i }).click();
    await page.getByLabel('Title').fill(goalTitle);
    await page.getByLabel('Target Value').fill('42');
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page).toHaveURL(/\/goals$/);
    await expect(page.getByRole('link', { name: goalTitle })).toBeVisible();

    const goal = await db.goal.findFirst({ where: { title: goalTitle } });
    expect(goal).not.toBeNull();
    expect(goal?.targetValue).toBe(42);
  });

  test('creates a goal from a preset template', async ({ authenticatedPage: page, db }) => {
    const templateTitle = 'E2E Preset Goal';

    await db.goalTemplate.create({
      data: {
        category: 'beginner',
        targetType: 'DISTANCE',
        targetValue: 50,
        periodType: 'WEEKLY',
        isPreset: true,
        translations: { create: [{ locale: 'en', title: templateTitle }] },
      },
    });

    await page.goto('/en/goals/new');
    await page.getByRole('button', { name: templateTitle }).click();

    await expect(page.getByLabel('Title')).toHaveValue(templateTitle);
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page).toHaveURL(/\/goals$/);
    await expect(page.getByRole('link', { name: templateTitle })).toBeVisible();

    const goal = await db.goal.findFirst({ where: { title: templateTitle } });
    expect(goal).not.toBeNull();
    expect(goal?.targetValue).toBe(50);
  });

  test('redirects to login when accessing the page unauthenticated', async ({ page }) => {
    await page.goto('/en/goals/new');
    await expectUnauthenticated(page);
  });
});
