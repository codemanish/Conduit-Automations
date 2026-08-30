# AI Usage

This entire framework was built with Claude Code (Claude, Anthropic) acting as the implementer,
with me directing scope, reviewing output, and running/verifying everything against the real app.
This is a factual log of how that went, including where the AI got something wrong.

## Research phase

Before writing any code, I asked Claude to explore both the app under test and the (nearly empty)
automation repo, in parallel, and report back facts rather than assumptions:

- One sub-agent read `node-express-sequelize-realworld-example-app`'s route files
  (`routes/api/*.js`), `routes/auth.js`, `config/index.js`, and `models/index.js` to produce a
  full endpoint list, confirm the JWT auth header format (`Authorization: Token <jwt>`), and
  confirm there is no DB reset endpoint (persistent SQLite file by default).
- A second sub-agent inventoried the automation repo (`Conduit-Automations`): confirmed it was
  git-initialized with only a README, on branch `user/manish/featurebranch`, with Node 24 and
  Playwright reachable via `npx` but not yet installed.

This surfaced a real naming discrepancy worth calling out: the assignment brief says
"Conduit-Automation" but the actual repo is named **"Conduit-Automations"** (plural) — the AI
caught this from the directory listing rather than silently assuming the brief's spelling.

## Planning phase

I asked two clarifying questions before committing to an approach (via the plan-mode
question tool), rather than letting the AI guess silently:

1. Which git branch to build on (`main` vs the existing pushed `user/manish/featurebranch`) → I
   chose to continue on the feature branch.
2. How much "agentic infrastructure" to build — a "Focused" tier (CLAUDE.md + typed layers +
   fixtures + factories + one template test) vs a "Heavier" tier (same, plus custom ESLint rules
   enforcing the architecture and a scripted self-check). → I chose Focused, since I'm early in
   Playwright and didn't want a second layer of tooling I'd have to maintain and understand.

The resulting plan (architecture decisions, file layout, exact 5 tests, auth/data strategy) was
written to a plan file and approved before any code was written.

## Implementation phase — where the AI got it wrong

Two concrete bugs made it into the first version of the code and were only caught by actually
running the suite against the live app (not just by type-checking or reading the code):

### 1. API paths silently dropped `/api` due to a URL-resolution gotcha

The AI initially wrote every API client call with a leading slash, e.g.:

```ts
await this.request.post('/users', { data: { user: newUser } });
```

with `baseURL` set to `http://localhost:3000/api`. Running the suite failed all 6 tests with:

```
Error: Register failed: 404 error: 404 Not Found /users
```

The AI's own analysis had missed a real edge case of the WHATWG URL spec: when a relative
reference starts with `/`, it resolves against the **origin root**, not the base URL's path —
so `new URL('/users', 'http://localhost:3000/api')` produces `http://localhost:3000/users`,
silently dropping `/api`. This was verified directly rather than assumed:

```
$ node -e "console.log(new URL('/users', 'http://localhost:3000/api').href)"
http://localhost:3000/users
```

**Fix applied:** `API_BASE_URL` now ends in a trailing slash
(`http://localhost:3000/api/`), and every API client call uses a path with no leading slash
(`'users'`, `'articles/${slug}'`, etc.). This distinction is now called out explicitly as a rule
in `CLAUDE.md` so a future agent (or contributor) doesn't reintroduce it.

### 2. Generated usernames didn't match what the API returned, because the app lowercases them

The user/article factories originally used `faker.string.alphanumeric(6)`, which returns
mixed-case strings (e.g. `m3cXSA`). The first test run failed with:

```
Expected: "user_1787931204323_m3cXSA"
Received: "user_1787931204323_m3cxsa"
```

and a related test failed to log in at all (`422 {"errors":{"email or password":"is invalid"}}`)
because the registered (lowercased) email didn't match the mixed-case email the login call sent.
The AI traced this to real app behavior rather than guessing — `models/user.js` has explicit
Sequelize setters:

```js
set(v) { this.setDataValue('username', v.toLowerCase()) }   // and the same for email
```

**Fix applied:** both factories now lowercase the generated unique suffix, with a comment
explaining why (pointing at the exact file/lines in the app that make this necessary). This is a
good example of why the framework asserts against real API responses rather than mocked ones —
a mock would never have surfaced this.

## Adding negative tests surfaced two real bugs in the app itself (not in our code)

When asked to add negative tests for duplicate registration and wrong-password login, the AI
didn't assume what a "clear error" would look like — it verified against the running app first,
and that verification uncovered two genuine defects in `node-express-sequelize-realworld-example-app`,
not in this test framework:

### 1. Duplicate email/username registration returns a broken, unstructured error

Reading `routes/api/users.js` first (rather than guessing the response shape):

```js
router.post('/users', function(req, res, next) {
  ...
  user.save()
    .then(...)
    .catch((error) => {
      console.error(error);
      next();   // <- no error argument
    });
})
```

Calling `next()` with no argument skips Express's error-handling chain entirely and falls through
to `app.js`'s generic 404 handler. Verified directly against the running server:

```
$ curl -s -w "\nSTATUS:%{http_code}\n" -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d '{"user":{"username":"dupcheck3","email":"dupcheck1@example.com","password":"Test1234!"}}'
error: 404 Not Found /api/users
STATUS:404
```

So a duplicate email/username never gets the proper `422` structured validation error that, for
comparison, the wrong-password login path *does* return correctly (`422 {"errors":{"email or
password":"is invalid"}}`). This is why `registerExpectingFailure` (`src/api-clients/auth.client.ts`)
returns raw text instead of a typed error body — there's no structured JSON to type.

### 2. The UI silently shows nothing when that happens

Rather than assume the frontend "must" show some error, the AI wrote a small throwaway Playwright
script to drive a real browser through: register once, then register again with the same email,
and read the actual rendered page. Result: the app stays on `/register` (registration did fail)
but renders **no visible error message at all** — confirmed by reading the DOM directly, not by
inspecting source code alone.

Root cause, traced through the frontend source: `middleware.js`'s `promiseMiddleware` does
`action.payload = error.response.body` when a request fails; since the 404 response above isn't
valid JSON, `error.response.body` is empty, so `ListErrors.js` (which only renders when an
`errors` object exists) renders nothing. A real user hitting this today gets no feedback that
their registration failed.

**Why this matters for AI usage specifically:** it would have been easy for the AI to just assert
"an error message is shown" by pattern-matching the wrong-password test, without checking — that
assertion would have been *wrong*, and the test would have failed for a reason that had nothing to
do with what it was actually trying to prove. Verifying first (curl for the API shape, a scripted
browser run for the UI behavior) is what caught this before it became a flaky-looking, confusing
test failure instead of a documented, intentional one. Both tests now assert the *real* current
behavior, with comments pointing at the exact app code responsible, and this is called out in
`README.md` so nobody mistakes it for a bug in the test suite itself.

## Where AI output was used largely as-is

The Page Object selectors (`getByPlaceholder('Email')`, `getByRole('button', { name: 'Sign in' })`,
etc.) were derived by having the AI read the actual React components
(`Login.js`, `Register.js`, `Editor.js`, `Header.js`, `App.js`) in the app's frontend submodule
first, rather than guessing selectors — e.g. confirming the JWT bootstrap flow reads
`localStorage.getItem('jwt')` in `App.js`'s `componentWillMount`, and that a successful
login/register redirects to `/` (`reducers/common.js`), before writing the `authenticatedPage`
fixture and the login UI test's assertion. Because the underlying facts were verified against the
real source first, this code passed on the first full test run after the two fixes above.
