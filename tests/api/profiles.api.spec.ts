import { test, expect } from '../../src/fixtures/test-options';
import { buildUser } from '../../src/factories/user.factory';

test.describe('Profiles API', () => {
  test('a user can follow another user and see following: true on their profile', async ({
    auth,
    profiles,
    newUser,
  }) => {
    const otherCandidate = buildUser();
    await auth.register(otherCandidate);

    const { profile } = await profiles.follow(otherCandidate.username, newUser.token);

    expect(profile.username).toBe(otherCandidate.username);
    expect(profile.following).toBe(true);
  });
});
