import { test, expect } from '../../src/fixtures/test-options';
import { buildUser } from '../../src/factories/user.factory';
import { LoginPage } from '../../src/pages/login.page';
import { RegisterPage } from '../../src/pages/register.page';

test('a registered user can log in through the UI', async ({ page, auth }) => {
  // The account is created via the API so this test stays focused on the login flow itself.
  const candidate = buildUser();
  await auth.register(candidate);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(candidate.email, candidate.password);

  // A successful login redirects to "/" and the header shows the username.
  await expect(page).toHaveURL('/');
  await expect(page.getByText(candidate.username)).toBeVisible();
});

test('logging in with the wrong password shows an error and does not navigate away', async ({ page, auth }) => {
  const candidate = buildUser();
  await auth.register(candidate);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(candidate.email, 'WrongPassword1!');

  await expect(page).toHaveURL('/login');
  await expect(loginPage.errorMessages).toHaveText('email or password is invalid');
});

test('registering with an email that is already taken does not create a second account', async ({ page, auth }) => {
  const candidate = buildUser();
  await auth.register(candidate);

  const registerPage = new RegisterPage(page);
  await registerPage.goto();
  await registerPage.register(buildUser().username, candidate.email, 'Test1234!');

  // Verified against the running app: registering with a duplicate email does NOT redirect
  // (registration genuinely failed) but also shows no visible error message - the backend's
  // failure response isn't valid JSON here (see registerExpectingFailure in auth.client.ts),
  // so the frontend's error reducer never gets an `errors` object to render via ListErrors.js.
  // This is a real, silent-failure gap in the app's UX, not a mistake in this assertion.
  await expect(page).toHaveURL('/register');
  await expect(registerPage.errorMessages).toHaveCount(0);
});
