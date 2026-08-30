import type { APIRequestContext } from '@playwright/test';
import type { ErrorsResponse, NewUser, UserResponse } from '../types/api';

/** Thin wrapper over the /users endpoints. baseURL (http://localhost:3000/api) comes from playwright.config.ts. */
export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  async register(newUser: NewUser): Promise<UserResponse> {
    const response = await this.request.post('users', { data: { user: newUser } });
    if (!response.ok()) {
      throw new Error(`Register failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async login(email: string, password: string): Promise<UserResponse> {
    const response = await this.request.post('users/login', {
      data: { user: { email, password } },
    });
    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }
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

/** The app accepts `Token <jwt>` (Bearer also works, but this matches the app's own frontend). */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Token ${token}` };
}
