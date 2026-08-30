# Conduit-Automations

Playwright + TypeScript test framework for [Conduit](https://github.com/cirosantilli/node-express-sequelize-realworld-example-app),
a Medium-style "RealWorld" reference app (Express + Sequelize + SQLite API, React frontend).

Built as an "agentic-first" framework: the layout, typed API layer, and fixtures are designed
so an AI coding agent (or a new engineer) can add a test, page object, or API client correctly
on the first try. See [CLAUDE.md](./CLAUDE.md) for the exact recipe, and
[DECISIONS.md](./DECISIONS.md) / [AI_USAGE.md](./AI_USAGE.md) for the reasoning behind this repo.

## Prerequisites

- Node.js 18+ (tested on Node 24)
- The app under test, running locally from a sibling checkout of
  `node-express-sequelize-realworld-example-app`

## 1. Start the app under test

```bash
cd ../node-express-sequelize-realworld-example-app
npm install
npm run dev
# API:  http://localhost:3000/api
# UI:   http://localhost:4101
```

`npm run dev` runs the Express API and the React frontend together. Leave it running in this
terminal.

## 2. Install and run the test suite

In a second terminal, from this repo:

```bash
npm install
npx playwright install chromium
cp .env.example .env   # defaults already point at localhost:3000 / localhost:4101
npm test               # runs everything: API + UI
```

Other useful scripts:

```bash
npm run test:api     # API tests only (no browser)
npm run test:ui      # UI tests only
npm run test:headed  # UI tests with a visible browser window
npm run report       # open the last HTML report
npm run typecheck    # tsc --noEmit
```

Tests create their own unique users/articles through the app's public API on every run, so the
suite is safe to run repeatedly against the same (persistent) SQLite database without any manual
reset step.

## Project layout

```
tests/
  api/            API-only tests (Playwright's request fixture, no browser)
  ui/             UI tests (real browser, Page Object Model)
  _template.spec.ts   worked example to copy when adding a new test
src/
  api-clients/    typed wrappers over the REST API (one per resource)
  pages/          Page Object Model, one class per screen
  factories/      generate unique, self-contained test data
  fixtures/       custom Playwright fixtures (auth, api clients, pre-authenticated page)
  types/          TypeScript interfaces mirroring the app's JSON responses
```

## What's covered

- **API**: register, login, create an article, comment on an article, plus negative cases
  (duplicate-email registration, wrong-password login)
- **UI**: register/login through the real form, publish an article through the editor, plus
  negative cases (duplicate-email registration, wrong-password login)

10 tests total. This is a deliberately small, high-signal suite (depth over breadth) — see
[DECISIONS.md](./DECISIONS.md) for what's out of scope and why.

Note: the negative registration tests document real, verified behavior of the app under
test — a duplicate email/username does not return a proper validation error (see the comment on
`registerExpectingFailure` in `src/api-clients/auth.client.ts`), and the UI shows no visible error
message for it either. These assertions describe what the app actually does, not what it should
do — fixing that is out of scope since modifying the app under test isn't part of this framework.
