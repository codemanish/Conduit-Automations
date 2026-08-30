import type { Page } from '@playwright/test';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  async register(username: string, email: string, password: string) {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Email').fill(email);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
  }

  /** The <ul class="error-messages"> the app renders on a failed registration (see ListErrors.js). */
  get errorMessages() {
    return this.page.locator('.error-messages');
  }
}
