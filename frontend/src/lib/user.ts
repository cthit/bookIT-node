import { queryOptions, useQuery } from "@tanstack/react-query";
import { request } from "@/api/client";
import { CurrentUserDocument } from "@/generated/graphql";
export const userOptions = queryOptions({
  queryKey: ["user"],
  queryFn: async () => {
    const { user } = await request(CurrentUserDocument, {});
    if (!user) throw new Error("Please sign in to book a room.");
    return user;
  },
  staleTime: 60_000,
  retry: false,
});
export function useUser() {
  return useQuery(userOptions);
}
