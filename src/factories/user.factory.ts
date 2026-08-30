import { faker } from '@faker-js/faker';
import type { NewUser } from '../types/api';

/**
 * Always produces a unique user. The app has no test-reset endpoint and keeps a
 * persistent SQLite file, so uniqueness (not DB cleanup) is what keeps tests
 * parallel-safe and re-runnable.
 *
 * Lowercased on purpose: models/user.js normalizes both username and email to lowercase
 * on save (see the `set()` hooks there), so a mixed-case value here would round-trip from
 * the API in a different case than what we sent - generating lowercase avoids that mismatch.
 */
export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const unique = `${Date.now()}_${faker.string.alphanumeric(6)}`.toLowerCase();
  return {
    username: `user_${unique}`,
    email: `user_${unique}@example.com`,
    password: 'Test1234!',
    ...overrides,
  };
}
