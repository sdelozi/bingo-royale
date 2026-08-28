function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: getRequiredEnv("NEXT_PUBLIC_APP_URL"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  authSecret: getRequiredEnv("AUTH_SECRET"),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  credentialsPasswordPepper: process.env.CREDENTIALS_PASSWORD_PEPPER ?? ""
};
