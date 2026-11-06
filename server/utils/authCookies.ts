import type { CookieOptions, Request, Response } from "express";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "todo_auth_token";

export function getCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const secureConfigured = process.env.COOKIE_SECURE;
  const secure =
    secureConfigured === undefined
      ? isProduction
      : secureConfigured.toLowerCase() === "true";

  const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
  const sameSite =
    configuredSameSite === "lax" ||
    configuredSameSite === "strict" ||
    configuredSameSite === "none"
      ? configuredSameSite
      : isProduction
        ? "none"
        : "lax";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
}

export function getAuthCookieToken(req: Request): string | undefined {
  const cookies = (req as Request & {
    cookies?: Record<string, unknown>;
  }).cookies;
  const token = cookies?.[AUTH_COOKIE_NAME];
  return typeof token === "string" ? token : undefined;
}
