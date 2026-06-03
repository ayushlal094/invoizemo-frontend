// Access token lives ONLY in memory — never in localStorage or sessionStorage.
// This prevents XSS attacks from reading the token between page loads.
// On a full page refresh, the AuthProvider bootstraps via the HttpOnly refresh cookie.

let _token: string | null = null;

export const tokenStore = {
  get: (): string | null => _token,
  set: (t: string): void => {
    _token = t;
  },
  clear: (): void => {
    _token = null;
  },
};
