import type { APIRequestContext } from '@playwright/test';
import type { TagsResponse } from '../types/api';
import { expectOk } from './http';

/** Thin wrapper over the /tags endpoint. */
export class TagsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<TagsResponse> {
    const response = await this.request.get('tags');
    await expectOk(response, 'List tags');
    return response.json();
  }
}
