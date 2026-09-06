import type { Request } from "express";
import { GraphQLError } from "graphql";
import type { User } from "../models/user";

declare global {
  namespace Express {
    interface Request {
      appSession?: {
        groups?: unknown;
        is_admin?: unknown;
      };
    }
  }
}

export function authenticatedUser(req: Request): User {
  const claims = req.oidc.user;
  if (
    !req.oidc.isAuthenticated() ||
    typeof claims?.sub !== "string" ||
    typeof claims.cid !== "string"
  ) {
    throw new GraphQLError("Authentication required", { extensions: { code: "UNAUTHENTICATED" } });
  }
  const claim = (name: string): string => (typeof claims[name] === "string" ? claims[name] : "");
  const groups: unknown = req.appSession?.groups;
  return {
    sub: claims.sub,
    cid: claims.cid,
    name: claim("name"),
    nickname: claim("nickname"),
    locale: claim("locale"),
    groups: Array.isArray(groups)
      ? groups.filter((group): group is string => typeof group === "string")
      : [],
    is_admin: req.appSession?.is_admin === true,
  };
}
