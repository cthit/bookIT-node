import { describe, expect, it } from "vite-plus/test";
import { applicationImages } from "./application-images";

const frontend = `ghcr.io/cthit/bookit-node-frontend@sha256:${"a".repeat(64)}`;
const backend = `ghcr.io/cthit/bookit-node-backend@sha256:${"b".repeat(64)}`;

describe("E2E application mode", () => {
  it("defaults to local development servers", () => {
    expect(applicationImages({})).toBeUndefined();
  });

  it("requires published-image mode in CI", () => {
    expect(() => applicationImages({ CI: "true" })).toThrow("CI E2E requires");
  });

  it("accepts immutable frontend and backend references", () => {
    expect(
      applicationImages({
        E2E_MODE: "images",
        CI: "true",
        BOOKIT_FRONTEND_IMAGE: frontend,
        BOOKIT_BACKEND_IMAGE: backend,
      }),
    ).toEqual({ frontend, backend });
  });

  it("accepts commit tags from CI", () => {
    const commit = "c".repeat(40);
    const images = {
      frontend: `ghcr.io/cthit/bookit-node-frontend:${commit}`,
      backend: `ghcr.io/cthit/bookit-node-backend:${commit}`,
    };
    expect(
      applicationImages({
        E2E_MODE: "images",
        CI: "true",
        BOOKIT_FRONTEND_IMAGE: images.frontend,
        BOOKIT_BACKEND_IMAGE: images.backend,
      }),
    ).toEqual(images);
  });

  it.each([
    undefined,
    "ghcr.io/cthit/bookit-node-backend:latest",
    "ghcr.io/cthit/bookit-node-backend:abc1234",
    "backend@sha256:abc",
  ])("rejects missing or unpinned image references: %s", (value) => {
    expect(() =>
      applicationImages({
        E2E_MODE: "images",
        BOOKIT_FRONTEND_IMAGE: frontend,
        BOOKIT_BACKEND_IMAGE: value,
      }),
    ).toThrow("BOOKIT_BACKEND_IMAGE must use");
  });

  it("does not silently ignore image references in development mode", () => {
    expect(() => applicationImages({ BOOKIT_FRONTEND_IMAGE: frontend })).toThrow(
      "Set E2E_MODE=images",
    );
  });

  it("rejects unknown modes", () => {
    expect(() => applicationImages({ E2E_MODE: "production" })).toThrow("E2E_MODE must be");
  });
});
