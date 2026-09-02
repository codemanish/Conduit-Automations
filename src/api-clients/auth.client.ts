import type { APIRequestContext } from '@playwright/test';
import type { ErrorsResponse, NewUser, UpdateUserFields, UserResponse } from '../types/api';
import { authHeader, expectOk } from './http';

/** Thin wrapper over the /users and /user endpoints. baseURL (http://localhost:3000/api) comes from playwright.config.ts. */
export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  async register(newUser: NewUser): Promise<UserResponse> {
    const response = await this.request.post('users', { data: { user: newUser } });
    await expectOk(response, 'Register');
    return response.json();
  }

  async login(email: string, password: string): Promise<UserResponse> {
    const response = await this.request.post('users/login', {
      data: { user: { email, password } },
    });
    await expectOk(response, 'Login');
    return response.json();
  }

  /** GET /user - the currently authenticated user, per the token passed in. */
  async current(token: string): Promise<UserResponse> {
    const response = await this.request.get('user', { headers: authHeader(token) });
    await expectOk(response, 'Get current user');
    return response.json();
  }

  /** PUT /user - partial update; only the fields you pass are changed. */
  async updateSettings(fields: UpdateUserFields, token: string): Promise<UserResponse> {
    const response = await this.request.put('user', {
      headers: authHeader(token),
      data: { user: fields },
    });
    await expectOk(response, 'Update settings');
    return response.json();
  }

  /**
   * For negative tests only: does NOT throw on failure - hands back the raw status and body.
   * NOTE: a duplicate email/username does not get a structured JSON error from this app - see
   * routes/api/users.js, whose catch block calls `next()` with no error argument, which Express
   * then routes to app.js's generic 404 handler instead of a proper 422 validation error. That's
   * why this returns raw text rather than a typed ErrorsResponse (there isn't one to type).
   */
  async registerExpectingFailure(newUser: NewUser): Promise<{ status: number; text: string }> {
    const response = await this.request.post('users', { data: { user: newUser } });
    return { status: response.status(), text: await response.text() };
  }

  /** For negative tests only: does NOT throw on failure - hands back the raw status and the structured error body. */
  async loginExpectingFailure(email: string, password: string): Promise<{ status: number; body: ErrorsResponse }> {
    const response = await this.request.post('users/login', {
      data: { user: { email, password } },
    });
    return { status: response.status(), body: await response.json() };
  }
}
