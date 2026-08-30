import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByPlaceholder('Email').fill(email);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  /** The <ul class="error-messages"> the app renders on a failed login (see ListErrors.js). */
  get errorMessages() {
    return this.page.locator('.error-messages');
  }
}
