import type { APIRequestContext } from '@playwright/test';
import type { ArticleResponse, CommentResponse, CommentsResponse, NewArticle } from '../types/api';
import { authHeader, expectOk } from './http';

/** Thin wrapper over the /articles endpoints. All write methods require a JWT. */
export class ArticlesClient {
  constructor(private readonly request: APIRequestContext) {}

  async create(article: NewArticle, token: string): Promise<ArticleResponse> {
    const response = await this.request.post('articles', {
      headers: authHeader(token),
      data: { article },
    });
    await expectOk(response, 'Create article');
    return response.json();
  }

  async getBySlug(slug: string): Promise<ArticleResponse> {
    const response = await this.request.get(`articles/${slug}`);
    await expectOk(response, 'Get article');
    return response.json();
  }

  /** PUT /articles/:slug - partial update; only the fields you pass are changed. Requires the
   *  token of the article's author (the app returns 403 otherwise). */
  async update(slug: string, fields: Partial<NewArticle>, token: string): Promise<ArticleResponse> {
    const response = await this.request.put(`articles/${slug}`, {
      headers: authHeader(token),
      data: { article: fields },
    });
    await expectOk(response, 'Update article');
    return response.json();
  }

  /** DELETE /articles/:slug - requires the author's token; the app returns 204 with no body. */
  async delete(slug: string, token: string): Promise<void> {
    const response = await this.request.delete(`articles/${slug}`, { headers: authHeader(token) });
    await expectOk(response, 'Delete article');
  }

  async favorite(slug: string, token: string): Promise<ArticleResponse> {
    const response = await this.request.post(`articles/${slug}/favorite`, { headers: authHeader(token) });
    await expectOk(response, 'Favorite article');
    return response.json();
  }

  async unfavorite(slug: string, token: string): Promise<ArticleResponse> {
    const response = await this.request.delete(`articles/${slug}/favorite`, { headers: authHeader(token) });
    await expectOk(response, 'Unfavorite article');
    return response.json();
  }

  async addComment(slug: string, body: string, token: string): Promise<CommentResponse> {
    const response = await this.request.post(`articles/${slug}/comments`, {
      headers: authHeader(token),
      data: { comment: { body } },
    });
    await expectOk(response, 'Add comment');
    return response.json();
  }

  async getComments(slug: string): Promise<CommentsResponse> {
    const response = await this.request.get(`articles/${slug}/comments`);
    await expectOk(response, 'Get comments');
    return response.json();
  }
}
