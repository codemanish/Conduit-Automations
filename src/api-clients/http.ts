import type { APIResponse } from '@playwright/test';

/** The app accepts `Token <jwt>` (Bearer also works, but this matches the app's own frontend). */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Token ${token}` };
}

/** Throws a consistent, debuggable error for any client's happy-path methods. Negative-test
 *  methods (the `*ExpectingFailure` ones) skip this on purpose and return the raw status/body. */
export async function expectOk(response: APIResponse, label: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${label} failed: ${response.status()} ${await response.text()}`);
  }
}
