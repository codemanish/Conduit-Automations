// TEMPLATE - copy this file into tests/api or tests/ui and rename it, then delete the
// half (API or UI) you don't need. This file is not run by any project (it lives outside
// tests/api and tests/ui, and playwright.config.ts scopes each project to one of those
// folders), so it's safe to leave here as a reference.
//
// See CLAUDE.md at the repo root for the full "how do I add a test" recipe.

import { test, expect } from '../src/fixtures/test-options';
import { buildUser } from '../src/factories/user.factory';
import { buildArticle } from '../src/factories/article.factory';
import { LoginPage } from '../src/pages/login.page';

// ---- API test pattern -------------------------------------------------------------
// Fixtures available: `auth` (AuthClient), `articles` (ArticlesClient), `newUser`
// (a fresh, already-registered user + token - use this instead of calling auth.register
// yourself whenever the test just needs "some logged-in user").
test('API: example - authenticated action against the app', async ({ articles, newUser }) => {
  const draft = buildArticle(); // always produces unique data, never hardcode a title/slug

  const { article } = await articles.create(draft, newUser.token);

  expect(article.title).toBe(draft.title);
});

// ---- UI test pattern ---------------------------------------------------------------
// Fixtures available: `page` (plain, logged-out browser page) and `authenticatedPage`
// (already logged in via localStorage - use this unless the test is specifically about
// the login/registration form).
//
// Never put a raw CSS selector or fetch() call in a spec file:
//   - browser interactions belong in a Page Object under src/pages/
//   - HTTP calls belong in an API client under src/api-clients/
test('UI: example - drive a real form', async ({ page, auth }) => {
  const candidate = buildUser();
  await auth.register(candidate);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(candidate.email, candidate.password);

  await expect(page).toHaveURL('/');
});
