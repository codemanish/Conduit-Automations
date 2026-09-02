import { test, expect } from '../../src/fixtures/test-options';
import { buildArticle } from '../../src/factories/article.factory';

test.describe('Tags API', () => {
  test('lists a tag used by an existing article', async ({ articles, tags, newUser }) => {
    // buildArticle() defaults tagList to ['automation'] - no override needed.
    await articles.create(buildArticle(), newUser.token);

    const { tags: tagList } = await tags.list();

    expect(tagList).toContain('automation');
  });
});
