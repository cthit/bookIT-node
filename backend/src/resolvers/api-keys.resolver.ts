import { User } from "../models/user";
import { Tools } from "../utils/commonTypes";
import { APIKey } from "../models/api-key";

export const getAPIKeysQResolvers = ({ prisma }: Tools) => ({
  api_keys: async (_: any, __: any, context: { user: User }) => {
    if (!context.user.is_admin) {
      return null;
    }
    return await prisma.api_keys.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  },
});

export const getAPIKeysMResolvers = ({ prisma }: Tools) => ({
  createAPIKey: async (
    _: any,
    { api_key }: { api_key: APIKey },
    context: { user: User },
  ) => {
    if (!context.user.is_admin) {
      return null;
    }
    return await prisma.api_keys.create({
      data: {
        name: api_key.name,
        description: api_key.description,
      },
    });
  },

  deleteAPIKey: async (
    _: any,
    { id }: { id: string },
    context: { user: User },
  ) => {
    if (!context.user.is_admin) {
      return {
        sv: "Kan er radera API-nyckel, användare har ej adminprivilegier",
        en: "Unable to delete API-key, the user does not have admin privileges",
      };
    }
    const api_key = await prisma.api_keys.findUnique({
      where: {
        id: id,
      },
    });

    if (!api_key) {
      return {
        sv: "Kunde inte hitta API nyckeln",
        en: "API key not found",
      };
    }

    await prisma.api_keys.delete({
      where: {
        id: id,
      },
    });
    return null;
  },
});
