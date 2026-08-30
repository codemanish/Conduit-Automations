import { test, expect } from '../../src/fixtures/test-options';
import { buildArticle } from '../../src/factories/article.factory';
import { EditorPage } from '../../src/pages/editor.page';
import { ArticlePage } from '../../src/pages/article.page';

test('a logged-in user can publish an article and see it rendered', async ({ authenticatedPage }) => {
  const draft = buildArticle();

  const editorPage = new EditorPage(authenticatedPage);
  await editorPage.goto();
  await editorPage.publish(draft);

  // Publishing redirects to /article/:slug.
  await expect(authenticatedPage).toHaveURL(/\/article\//);
  const articlePage = new ArticlePage(authenticatedPage);
  await expect(articlePage.title).toHaveText(draft.title);
});
