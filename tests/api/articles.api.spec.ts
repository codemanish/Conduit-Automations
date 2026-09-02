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

test.describe('Articles API - favorites', () => {
  test('a user can favorite an article and see favoritesCount increase', async ({ articles, newUser }) => {
    const { article } = await articles.create(buildArticle(), newUser.token);

    const { article: favorited } = await articles.favorite(article.slug, newUser.token);

    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);
  });
});

test.describe('Articles API - edit and delete', () => {
  test('the author can edit an article and see the change reflected', async ({ articles, newUser }) => {
    const { article } = await articles.create(buildArticle(), newUser.token);
    const newTitle = `Updated ${article.title}`;

    const { article: updated } = await articles.update(article.slug, { title: newTitle }, newUser.token);

    expect(updated.title).toBe(newTitle);
  });

  test('the author can delete an article, after which it no longer exists', async ({ articles, newUser }) => {
    const { article } = await articles.create(buildArticle(), newUser.token);

    await articles.delete(article.slug, newUser.token);

    await expect(articles.getBySlug(article.slug)).rejects.toThrow(/404/);
  });
});
