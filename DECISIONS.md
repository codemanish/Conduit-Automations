# Architecture Decisions

Five decisions that shaped this framework. For each: what we chose, what we rejected and why,
and the constraint that would flip it.

## 1. One test runner for both API and UI: Playwright's `request` fixture, not a separate HTTP client

**Chose:** API tests use Playwright's built-in API testing support (`APIRequestContext`)
wrapped in thin typed clients (`src/api-clients/`), run through the same `@playwright/test`
runner as the UI tests.

**Rejected:** A separate library for API tests (e.g. `supertest`, `axios` + a plain test runner
like Jest/Vitest). This is the more common industry pattern for a Node backend, and it decouples
API tests from browser tooling entirely.

**Why:** One test runner means one config, one `.env`, one HTML report, one CI step (when we add
one), and one pattern to teach an agent instead of two. Since Playwright's API testing support is
a first-class, well-documented feature (not a hack), the decoupling benefit of a second tool
wasn't worth the duplicated setup.

**Would flip if:** the API surface were large enough (dozens of endpoints, contract testing,
schema validation against OpenAPI) that a dedicated API-testing tool's extra features
(e.g. Postman/Newman's data-driven collections, or Pact for contract tests) paid for the
duplicated tooling.

## 2. Self-contained, unique test data instead of database reset/seeding

**Chose:** Every test creates its own unique user (and article, where needed) through the
app's public API, via factories that timestamp+randomize usernames/emails/titles
(`src/factories/`). No database reset step exists anywhere in the suite.

**Rejected:** Resetting or seeding the SQLite database directly (e.g. via Sequelize, or by
deleting `db.sqlite3` between runs).

**Why:** The app has no admin/reset API endpoint, uses a persistent file-based SQLite DB by
default, and modifying the app under test is explicitly out of scope for this assignment.
Reaching around the API to touch the database directly would couple tests to internal schema
details that have nothing to do with what we're actually testing, and would break the moment the
app's storage layer changes. Uniqueness also happens to be the thing an agent (or a person)
most commonly forgets when hand-writing test data against a real database — baking it into a
factory function removes that whole class of flaky/colliding test.

**Would flip if:** the app exposed a `/test/reset` endpoint, or tests ran against a
freshly-provisioned container/DB per run (e.g. in CI) — at that point resetting state between
tests would be simpler than uniqueness-by-construction, and DB-level fixtures would be safe to
add without touching app internals ad hoc from the test suite.

## 3. Page Objects + typed API clients are the *only* two extension points

**Chose:** A spec file may only do one of two things: call a method on a Page Object
(`src/pages/`) for browser interaction, or call a method on a typed API client
(`src/api-clients/`) for HTTP calls. Nothing else is allowed to touch a CSS selector or `fetch`
directly. `CLAUDE.md` states this explicitly as a rule for anyone (human or agent) adding a test.

**Rejected:** Letting tests write raw locators and raw HTTP calls inline, with abstractions
extracted later "if a pattern emerges."

**Why:** With only one contributor today, inline code would be faster short term. But the whole
point of this assignment is agent-native design: an agent asked to "add a test for X" needs an
unambiguous, small answer to "where does this code go?" Two well-known layers give it that;
without them, an agent's output diverges test-by-test (different selector styles, different error
handling) in a way a human reviewer has to catch every time. It also makes wrong output fail
fast: a typo in a page object method name is a TypeScript compile error, not a silent bug buried
inside a 40-line test.

**Would flip if:** this were a solo, throwaway script rather than a framework meant to be
extended by others (including live, in Part 2) — a one-off script doesn't need reusable
abstractions.

## 4. UI tests authenticate via localStorage injection, except the one test that verifies login itself

**Chose:** A `authenticatedPage` fixture registers a user via the API and injects the JWT into
`localStorage` before the app boots (matching exactly how the app itself bootstraps a session —
see `App.js`'s `componentWillMount`, which reads `localStorage.getItem('jwt')`). Every UI test
uses this *except* `tests/ui/auth.ui.spec.ts`, which deliberately drives the real login form.

**Rejected:** Having every UI test log in through the actual form.

**Why:** Re-running the login UI flow in every test is slower and adds a shared point of failure
(if the login form breaks, every unrelated test fails too, obscuring the real regression). Since
exactly one test's job is to verify the login flow itself, every other test can treat "being
logged in" as a precondition, not something to re-prove.

**Would flip if:** the login flow were unstable or changed often enough that we wanted every test
to double as a canary for it — then the extra runtime cost of always going through the real form
would be worth the added safety net.

## 5. `CLAUDE.md` + strict types + one template test, over relying on prose documentation

**Chose:** Invest in structure that makes incorrect agent output fail mechanically — TypeScript
interfaces mirroring every API response (`src/types/api.ts`), fixtures that remove the setup
steps an agent tends to get wrong (uniqueness, auth), and one heavily-commented template test
(`tests/_template.spec.ts`) to copy — backed by a short, imperative `CLAUDE.md` at the repo root.

**Rejected:** A long, prose-heavy README/CONTRIBUTING doc as the primary way of steering agent
contributions, with no enforcing structure behind it.

**Why:** Documentation only helps if it's read and followed; a compile error or a fixture that
does the risky step for you helps whether or not it's read. Given the "Focused" scope for this
assignment (no custom ESLint rules or a scripted self-check — see the deliberately lighter
alternative below), the highest-leverage, lowest-maintenance mechanism was: correct-by-default
fixtures/factories, types that catch mistakes at compile time, and exactly one example to copy.

**Would flip if:** the framework had many contributors and recurring violations of the
Page-Object/API-client boundary (decision 3) started slipping through anyway — at that point,
custom ESLint rules that fail the build on a raw `fetch()` or raw selector in a spec file, plus a
scripted `typecheck && lint && test` self-check an agent runs before finishing, would be worth
the added setup and maintenance (we scoped this out for now as the "Heavier" tier).

## Out of scope (per assignment)

- **CI/CD pipeline** — not built, but straightforward to add later: a GitHub Actions workflow
  that starts the app (`npm run dev` in the app repo) and runs `npm test` here, on every PR.
  The two-project Playwright config (`api` / `ui`) already maps cleanly onto separate CI jobs
  if API and UI suites ever need to scale independently.
- **Full coverage, performance/load testing, multi-browser support, modifying the app under
  test** — explicitly out of scope per the assignment brief; not attempted.

## Known app defects the negative tests document (not framework bugs)

Writing negative tests for auth surfaced two real, verified defects in
`node-express-sequelize-realworld-example-app` itself — worth stating explicitly so they're never
mistaken for a mistake in this test suite:

1. **Duplicate email/username registration returns a broken, unstructured error.**
   `routes/api/users.js`'s `.catch()` on `user.save()` calls `next()` with no error argument,
   which skips Express's error-handling chain and falls through to `app.js`'s generic 404
   handler — so a duplicate registration comes back as a plain-text `404`, not the proper `422`
   validation error the login endpoint correctly returns for its own failure case.
2. **The UI shows no visible error when that happens.** Because the 404 response above isn't
   valid JSON, the frontend's `error.response.body` ends up empty, and `ListErrors.js` (which only
   renders when an `errors` object is present) renders nothing — a real user gets no feedback that
   their registration failed at all.

Both are asserted as the suite's real, current, expected behavior — `tests/api/auth.api.spec.ts`
and `tests/ui/auth.ui.spec.ts` document the exact status codes/response bodies involved — rather
than "fixed," since modifying the app under test is out of scope for this framework. If this were
in scope, the fix would be a one-line change (`next(error)` instead of `next()`), which would then
let the frontend's existing error-handling path work exactly as it already does for login.
