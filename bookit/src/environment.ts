export const requiredEnvironment = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export function databaseUrl(): string {
  const url = new URL(
    `postgresql://${requiredEnvironment("DB_HOST")}:${process.env.DB_PORT || "5432"}`,
  );
  url.username = encodeURIComponent(requiredEnvironment("DB_USER"));
  url.password = encodeURIComponent(requiredEnvironment("DB_PASS"));
  url.pathname = `/${encodeURIComponent(requiredEnvironment("DB_NAME"))}`;

  return url.href;
}
