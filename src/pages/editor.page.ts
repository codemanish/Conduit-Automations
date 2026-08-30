import type { Page } from '@playwright/test';
import type { NewArticle } from '../types/api';

export class EditorPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/editor');
  }

  /** Fills the form and publishes; the app redirects to /article/:slug on success. */
  async publish(article: NewArticle) {
    await this.page.getByPlaceholder('Article Title').fill(article.title);
    await this.page.getByPlaceholder("What's this article about?").fill(article.description);
    await this.page.getByPlaceholder('Write your article (in markdown)').fill(article.body);
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
  }
}
