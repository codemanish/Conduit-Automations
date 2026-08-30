# Agent guide: Conduit-Automations

You are contributing to a Playwright + TypeScript test suite for the Conduit RealWorld app.
Read this before adding a test, page object, or API client. See `DECISIONS.md` for the reasoning
behind these rules if you need it — this file is just the "how", not the "why".

## Rules (do not violate these)

1. **A spec file may only call two kinds of things**: a method on a Page Object
   (`src/pages/*.page.ts`) for anything that touches the browser, or a method on an API client
   (`src/api-clients/*.client.ts`) for anything that makes an HTTP request. Never put a raw CSS
   selector, `page.locator(...)`, or `fetch`/`request.post(...)` directly inside a `tests/**/*.spec.ts`
   file. If the method you need doesn't exist yet, add it to the relevant page object or client —
   don't inline it.
2. **Never hardcode test data** (usernames, emails, article titles). Always generate it via
   `buildUser()` (`src/factories/user.factory.ts`) or `buildArticle()`
   (`src/factories/article.factory.ts`), optionally with overrides. This keeps tests parallel-safe
   and re-runnable against the same persistent database.
3. **Usernames/emails must stay lowercase.** The app lowercases both on save (see
   `models/user.js` in the app repo). The factories already do this — don't bypass them by
   passing a mixed-case `overrides.username`/`overrides.email`.
4. **Prefer the `newUser` / `authenticatedPage` fixtures over registering/logging in by hand**,
   unless the test is specifically about registration or login. See "Fixtures" below.
5. **API client paths must not start with `/`.** `baseURL` ends in a trailing slash on purpose;
   a leading `/` in the request path resolves against the origin root and silently drops `/api`.
   Write `this.request.get('articles/foo')`, not `'/articles/foo'`.

## Where new tests go

- API-only test → `tests/api/<resource>.api.spec.ts`, run under the `api` Playwright project
  (no browser).
- UI test → `tests/ui/<flow>.ui.spec.ts`, run under the `ui` Playwright project.
- Start from `tests/_template.spec.ts` — it's a working, commented example of both patterns.
  Copy it, don't write a spec from scratch.

## Fixtures available in every test (`src/fixtures/test-options.ts`)

| Fixture | What it gives you |
|---|---|
| `auth` | `AuthClient` — register/login via the API |
| `articles` | `ArticlesClient` — create/read articles, add/list comments |
| `newUser` | A fresh, already-registered `{ username, email, password, token }`. Use this whenever a test just needs "some logged-in user". |
| `page` | Plain Playwright page, logged out. Use for the login/register flow tests themselves. |
| `authenticatedPage` | A browser page already logged in (JWT injected into `localStorage` before the app boots). Use for any UI test that needs auth but isn't testing login itself. |

## Adding a new Page Object

One class per screen in `src/pages/`, constructor takes `Page`, methods are named for user intent
(`login(email, password)`, not `fillEmailField(...)`/`clickSubmit()` as two separate calls unless
the test genuinely needs to inspect an intermediate state). Export it from `src/pages/index.ts`.

## Adding a new API client

One class per resource in `src/api-clients/`, constructor takes `APIRequestContext`. Every
response type must come from `src/types/api.ts` — add the interface there first if it doesn't
exist, matching the app's actual JSON shape (check the corresponding route file in
`routes/api/` in the app repo, not just the frontend, if you're unsure of a field name).

## Writing a negative test (asserting on a failure)

`register`/`login` (and similarly-shaped client methods) throw on any non-2xx response — that's
correct for happy-path tests, but useless if the test's whole point is that a call *should* fail.
For that, use (or add, following this pattern) an `*ExpectingFailure` method that returns
`{ status, body }` / `{ status, text }` instead of throwing — see `registerExpectingFailure` and
`loginExpectingFailure` in `src/api-clients/auth.client.ts`. Before assuming what a failure looks
like, verify it against the real running app first (`curl`, or a throwaway script) — this app's
two auth failure paths genuinely aren't shaped the same (one returns structured JSON, one doesn't;
see the comments in `auth.client.ts` and `DECISIONS.md`'s "Known app defects" section). For a UI
negative test, `LoginPage.errorMessages` / `RegisterPage.errorMessages` locators already exist for
asserting on (or the absence of) the rendered error message — don't inline `.error-messages` in a
spec file, use those getters.

## Before you finish

Run `npm run typecheck` and `npm test` (with the app running per the README) and make sure both
pass. A compiling-but-wrong test is still wrong — actually run it.
