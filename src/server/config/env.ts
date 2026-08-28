function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];

  return value && value.length > 0 ? value : undefined;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: getRequiredEnv("NEXT_PUBLIC_APP_URL"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  authSecret: getRequiredEnv("AUTH_SECRET"),
  googleClientId: getOptionalEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getOptionalEnv("GOOGLE_CLIENT_SECRET"),
  credentialsPasswordPepper: getOptionalEnv("CREDENTIALS_PASSWORD_PEPPER")
};
