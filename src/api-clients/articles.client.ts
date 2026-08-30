import type { APIRequestContext } from '@playwright/test';
import type { ArticleResponse, CommentResponse, CommentsResponse, NewArticle } from '../types/api';
import { authHeader } from './auth.client';

/** Thin wrapper over the /articles endpoints. All write methods require a JWT. */
export class ArticlesClient {
  constructor(private readonly request: APIRequestContext) {}

  async create(article: NewArticle, token: string): Promise<ArticleResponse> {
    const response = await this.request.post('articles', {
      headers: authHeader(token),
      data: { article },
    });
    if (!response.ok()) {
      throw new Error(`Create article failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async getBySlug(slug: string): Promise<ArticleResponse> {
    const response = await this.request.get(`articles/${slug}`);
    if (!response.ok()) {
      throw new Error(`Get article failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async addComment(slug: string, body: string, token: string): Promise<CommentResponse> {
    const response = await this.request.post(`articles/${slug}/comments`, {
      headers: authHeader(token),
      data: { comment: { body } },
    });
    if (!response.ok()) {
      throw new Error(`Add comment failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async getComments(slug: string): Promise<CommentsResponse> {
    const response = await this.request.get(`articles/${slug}/comments`);
    if (!response.ok()) {
      throw new Error(`Get comments failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }
}
