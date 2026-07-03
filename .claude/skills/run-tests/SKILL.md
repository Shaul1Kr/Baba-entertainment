---
name: run-tests
description: Use this skill whenever the user asks to run tests, "test this", "check if tests pass", "run the test suite", or similar. Runs the appropriate Node.js test layers (unit, integration, e2e) in the right order, handles the Docker/infra dependency for integration tests, and reports a clear pass/fail summary with failure details.
---

# Run Tests

Run the project's test suites in the right order, only starting infrastructure that's
actually needed, and give a clear summary at the end rather than dumping raw output.

## Steps

1. **Detect what's available**
   - Check `backend/package.json` for test scripts (typically `test`, `test:integration`).
   - Check for a Playwright config / `test:e2e` script (root or `frontend/`).
   - If the user asked for a specific layer only ("run the unit tests"), only run that
     layer. Otherwise run all layers that exist, in order: unit → integration → e2e.

2. **Unit tests first (fast, no infra)**
   - Run `npm test` in `backend/`.
   - These need no Docker/DB - if they fail, report immediately and ask whether to
     continue to integration/e2e or stop and fix first (unit failures usually mean
     integration/e2e will fail too, no point burning time running them).

3. **Integration tests (need Docker Mongo/Redis)**
   - Before running, check if the required containers are up: `docker compose ps`.
   - If Mongo/Redis aren't running, start them (`docker compose up -d`) and wait briefly
     for them to be ready before running tests - don't run integration tests against
     infra that isn't up yet.
   - Run `npm run test:integration` in `backend/`.
   - These tests hit real Mongo/Redis, including the concurrency test (verifies no
     oversell under concurrent requests) - flag clearly in the summary if this specific
     test fails, since it's the core requirement of the whole project.

4. **E2E tests (need the actual app running)**
   - Only run these if explicitly requested or if unit + integration both passed -
     they're the slowest and least useful to run against a broken backend.
   - Confirm the backend and frontend dev servers are running (or start them if the
     project has a way to do so headlessly) before running Playwright.
   - Run the Playwright test command.

5. **Summarize, don't dump**
   - Report a compact pass/fail count per layer (e.g. "Unit: 12/12 passed. Integration:
     4/5 passed (concurrency test PASSED). E2E: 2/2 passed.").
   - For any failure, show the specific test name and the relevant error/assertion
     message - not the full raw test runner output unless the user asks for it.
   - If everything passes, keep the summary short - don't pad a clean run with detail.

## Notes
- Don't tear down Docker containers after running - leave infra up for the next run
  or for continued dev work, unless the user explicitly asks to stop it.
- If a test layer doesn't exist yet in the project, say so plainly rather than silently
  skipping it without mention.
