import type { Request } from "express";
import jwt from "jsonwebtoken";
import { getAuthCookieToken } from "../utils/authCookies";

export interface GraphQLContext {
  userId?: string;
  token?: string;
}

export function tokenUserId(token: string): string | undefined {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return undefined;
    const payload = jwt.verify(
      token,
      secret
    ) as jwt.JwtPayload;
    const id = payload.sub || payload.userId;
    return typeof id === "string" && id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

export function createGraphQLContext(req: Request): GraphQLContext {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : getAuthCookieToken(req);
  return token ? { token, userId: tokenUserId(token) } : {};
}
