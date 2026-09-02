import type { APIRequestContext } from '@playwright/test';
import type { ProfileResponse } from '../types/api';
import { authHeader, expectOk } from './http';

/** Thin wrapper over the /profiles/:username endpoints. */
export class ProfilesClient {
  constructor(private readonly request: APIRequestContext) {}

  /** GET /profiles/:username - `token` is optional; pass it to get `following` relative to that user. */
  async get(username: string, token?: string): Promise<ProfileResponse> {
    const response = await this.request.get(`profiles/${username}`, {
      headers: token ? authHeader(token) : undefined,
    });
    await expectOk(response, 'Get profile');
    return response.json();
  }

  async follow(username: string, token: string): Promise<ProfileResponse> {
    const response = await this.request.post(`profiles/${username}/follow`, { headers: authHeader(token) });
    await expectOk(response, 'Follow profile');
    return response.json();
  }

  async unfollow(username: string, token: string): Promise<ProfileResponse> {
    const response = await this.request.delete(`profiles/${username}/follow`, { headers: authHeader(token) });
    await expectOk(response, 'Unfollow profile');
    return response.json();
  }
}
