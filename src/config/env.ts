import 'dotenv/config';

// Trailing slash matters: Playwright/URL resolve a leading-slash relative path (e.g. "/users")
// against the origin root, not the baseURL's path, which would silently drop "/api". Keep this
// trailing slash and keep api-client paths without a leading slash (e.g. "users", not "/users").
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/';
export const UI_BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:4101';
