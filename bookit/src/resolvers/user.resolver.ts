import { requiredEnvironment } from "../environment";
import { User } from "../models/user";

export const getUserQResolvers = () => ({
  user: (_: unknown, __: unknown, context: { user: User }) => {
    return context.user;
  },
  gammaUrl: () => requiredEnvironment("ISSUER_BASE_URL").replace(/\/+$/, ""),
});
