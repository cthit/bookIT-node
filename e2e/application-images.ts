export interface ApplicationImages {
  frontend: string;
  backend: string;
}

export function applicationImages(
  env: NodeJS.ProcessEnv = process.env,
): ApplicationImages | undefined {
  const mode = env.E2E_MODE ?? "dev";
  if (mode !== "dev" && mode !== "images") throw new Error("E2E_MODE must be dev or images");
  if (env.CI && mode !== "images") throw new Error("CI E2E requires E2E_MODE=images");

  if (mode === "dev") {
    if (env.BOOKIT_FRONTEND_IMAGE || env.BOOKIT_BACKEND_IMAGE)
      throw new Error("Set E2E_MODE=images when supplying BookIT image references");
    return undefined;
  }

  const digestImage = (name: string): string => {
    const value = env[name];
    if (!value || !/^[a-z0-9][a-z0-9._:/-]*@sha256:[a-f0-9]{64}$/.test(value))
      throw new Error(`${name} must be a registry image pinned with @sha256:<64 hex characters>`);
    return value;
  };

  return {
    frontend: digestImage("BOOKIT_FRONTEND_IMAGE"),
    backend: digestImage("BOOKIT_BACKEND_IMAGE"),
  };
}
