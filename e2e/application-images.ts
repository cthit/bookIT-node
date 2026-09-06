export interface ApplicationImages {
  frontend: string;
  backend: string;
}

export function applicationImages(
  env: NodeJS.ProcessEnv = process.env,
): ApplicationImages | undefined {
  const mode = env.E2E_MODE ?? "dev";
  if (mode !== "dev" && mode !== "images") {
    throw new Error("E2E_MODE must be dev or images");
  }
  if (env.CI && mode !== "images") {
    throw new Error("CI E2E requires E2E_MODE=images");
  }

  if (mode === "dev") {
    if (env.BOOKIT_FRONTEND_IMAGE || env.BOOKIT_BACKEND_IMAGE) {
      throw new Error("Set E2E_MODE=images when supplying BookIT image references");
    }
    return undefined;
  }

  const image = (name: string): string => {
    const value = env[name];
    if (!value || !/^[a-z0-9][a-z0-9._:/-]*(?::[a-f0-9]{40}|@sha256:[a-f0-9]{64})$/.test(value)) {
      throw new Error(`${name} must use a full commit-SHA tag or an @sha256 image digest`);
    }
    return value;
  };

  return {
    frontend: image("BOOKIT_FRONTEND_IMAGE"),
    backend: image("BOOKIT_BACKEND_IMAGE"),
  };
}
