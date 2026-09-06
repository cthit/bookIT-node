import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { CurrentUserDocument } from "../generated/graphql";
import { checkMutation, request } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("GraphQL transport", () => {
  it("sends credentials and rejects GraphQL failures even on HTTP 200", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ errors: [{ message: "Denied" }] }));
    vi.stubGlobal("fetch", fetch);
    await expect(request(CurrentUserDocument, {})).rejects.toThrow("Denied");
    expect(fetch).toHaveBeenCalledWith(
      "/api/graphql/v1",
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });
  it("reports expired authentication", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(request(CurrentUserDocument, {})).rejects.toThrow("session expired");
  });
  it("rejects an empty response rather than rendering false success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    await expect(request(CurrentUserDocument, {})).rejects.toThrow("no data");
  });
  it("preserves localized mutation validation errors", () => {
    expect(() => checkMutation({ en: "Denied", sv: "Nekad" }, "sv")).toThrow("Nekad");
    expect(() => checkMutation(null, "en")).not.toThrow();
  });
});
