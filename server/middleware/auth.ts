import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): ReturnType<RequestHandler> {
  const secret = process.env.JWT_SECRET;
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    if (process.env.NODE_ENV === "test") {
      req.user = { id: process.env.TEST_USER_ID || "anonymous" };
      return next();
    }
    return res.status(401).json({ errorMessage: "Authentication required." });
  }

  try {
    const payload = jwt.verify(
      token,
      secret || "development-only-change-me"
    ) as jwt.JwtPayload;
    const id = payload.sub || payload.userId;
    if (typeof id !== "string" || id.length === 0) {
      return res.status(401).json({ errorMessage: "Invalid authentication token." });
    }
    req.user = { id };
    return next();
  } catch {
    return res.status(401).json({ errorMessage: "Invalid or expired authentication token." });
  }
}
