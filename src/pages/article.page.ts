import type { Page } from '@playwright/test';

export class ArticlePage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/article/${slug}`);
  }

  get title() {
    return this.page.getByRole('heading', { level: 1 });
  }
}
