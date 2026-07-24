import { test, expect } from '../fixtures/auth.fixture';

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
});
