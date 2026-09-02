import { test, expect } from '../../src/fixtures/test-options';
import { buildUser } from '../../src/factories/user.factory';

test.describe('Auth API', () => {
  test('registers a new user and returns a token', async ({ auth }) => {
    const candidate = buildUser();

    const { user } = await auth.register(candidate);

    expect(user.username).toBe(candidate.username);
    expect(user.email).toBe(candidate.email);
    expect(user.token).toBeTruthy();
  });

  test('logs in with the credentials just registered', async ({ auth }) => {
    const candidate = buildUser();
    await auth.register(candidate);

    const { user } = await auth.login(candidate.email, candidate.password);

    expect(user.email).toBe(candidate.email);
    expect(user.token).toBeTruthy();
  });
});

test.describe('Auth API - negative cases', () => {
  test('fails to register a second account with an email that is already taken', async ({ auth }) => {
    const candidate = buildUser();
    await auth.register(candidate);

    const duplicate = buildUser({ email: candidate.email });
    const { status, text } = await auth.registerExpectingFailure(duplicate);

    // Verified against the running app: a duplicate email/username does not come back as a
    // proper 422 validation error - it hits app.js's generic 404 handler instead (see the
    // comment on registerExpectingFailure). This is real, current app behavior, not a mistake
    // in this assertion.
    expect(status).toBe(404);
    expect(text).toContain('Not Found');
  });

  test('fails to log in with the wrong password', async ({ auth }) => {
    const candidate = buildUser();
    await auth.register(candidate);

    const { status, body } = await auth.loginExpectingFailure(candidate.email, 'WrongPassword1!');

    expect(status).toBe(422);
    expect(body.errors).toEqual({ 'email or password': 'is invalid' });
  });
});

test.describe('Auth API - settings', () => {
  test('an authenticated user can update their bio and see it reflected in GET /user', async ({ auth, newUser }) => {
    const newBio = 'QA engineer who writes typed API clients.';

    await auth.updateSettings({ bio: newBio }, newUser.token);
    const { user } = await auth.current(newUser.token);

    expect(user.bio).toBe(newBio);
  });
});
