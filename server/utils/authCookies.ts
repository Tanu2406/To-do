import type { CookieOptions, Request, Response } from "express";

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE_NAME || "todo_auth_token";
}

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
  res.cookie(getAuthCookieName(), token, {
    ...getCookieOptions(),
    maxAge: 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(getAuthCookieName(), getCookieOptions());
}

export function getAuthCookieToken(req: Request): string | undefined {
  const cookies = (req as Request & {
    cookies?: Record<string, unknown>;
  }).cookies;
  const token = cookies?.[getAuthCookieName()];
  return typeof token === "string" ? token : undefined;
}

export function getAuthCookieTokenFromHeader(
  cookieHeader: string | undefined
): string | undefined {
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== getAuthCookieName()) {
      continue;
    }

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}
