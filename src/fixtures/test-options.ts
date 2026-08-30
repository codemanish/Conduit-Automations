import { test as base, request as pwRequest } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import { AuthClient, ArticlesClient } from '../api-clients';
import { buildUser } from '../factories/user.factory';
import { API_BASE_URL, UI_BASE_URL } from '../config/env';
import type { NewUser } from '../types/api';

type AuthedUser = NewUser & { token: string };

type Fixtures = {
  /** Talks to the API directly, regardless of which project (api/ui) the test runs under. */
  apiContext: APIRequestContext;
  auth: AuthClient;
  articles: ArticlesClient;
  /** A fresh, unique, already-registered user. Use this when a test needs "some logged-in
   *  user" but isn't itself testing registration or login. */
  newUser: AuthedUser;
  /** A browser page that's already logged in (via localStorage), for UI tests that need auth
   *  but aren't testing the login form itself. */
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  apiContext: async ({}, use) => {
    const context = await pwRequest.newContext({ baseURL: API_BASE_URL });
    await use(context);
    await context.dispose();
  },

  auth: async ({ apiContext }, use) => {
    await use(new AuthClient(apiContext));
  },

  articles: async ({ apiContext }, use) => {
    await use(new ArticlesClient(apiContext));
  },

  newUser: async ({ auth }, use) => {
    const candidate = buildUser();
    const { user } = await auth.register(candidate);
    await use({ ...candidate, token: user.token });
  },

  authenticatedPage: async ({ browser, newUser }, use) => {
    const context = await browser.newContext({ baseURL: UI_BASE_URL });
    // The app reads `jwt` from localStorage on startup (see App.js componentWillMount).
    // addInitScript runs before any page script, so the token is present the moment the
    // React app boots - no need to drive the login form for tests that don't test login itself.
    await context.addInitScript((token) => {
      window.localStorage.setItem('jwt', token);
    }, newUser.token);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
