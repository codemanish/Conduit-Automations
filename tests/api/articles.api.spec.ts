import { test, expect } from '../../src/fixtures/test-options';
import { buildArticle } from '../../src/factories/article.factory';

test.describe('Articles API', () => {
  test('creates an article and reads it back by slug', async ({ articles, newUser }) => {
    const draft = buildArticle();

    const { article: created } = await articles.create(draft, newUser.token);
    const { article: fetched } = await articles.getBySlug(created.slug);

    expect(fetched.title).toBe(draft.title);
    expect(fetched.body).toBe(draft.body);
    expect(fetched.author.username).toBe(newUser.username);
  });

  test('adds a comment to an article and lists it back', async ({ articles, newUser }) => {
    const { article } = await articles.create(buildArticle(), newUser.token);
    const commentBody = 'Great write-up!';

    await articles.addComment(article.slug, commentBody, newUser.token);
    const { comments } = await articles.getComments(article.slug);

    expect(comments.some((comment) => comment.body === commentBody)).toBe(true);
  });
});
