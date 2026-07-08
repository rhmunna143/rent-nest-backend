import dotenv from "dotenv";
dotenv.config();

const DAY_MS = 24 * 60 * 60 * 1000;

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  port: process.env.PORT || 8080,

  databaseUrl: process.env.DATABASE_URL,

  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ??
    process.env.JWT_SECRET ??
    "dev-access-secret-change-me",

  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "1d",

  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",

  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "36d",

  // Cookie lifetimes — keep in sync with the token expiries above.
  accessCookieMaxAgeMs: 1 * DAY_MS,
  refreshCookieMaxAgeMs: 36 * DAY_MS,
  bcryptSaltRounds: 10,

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  paymentSuccessUrl:
    process.env.PAYMENT_SUCCESS_URL ?? "http://localhost:8080/payment-success",
  paymentCancelUrl:
    process.env.PAYMENT_CANCEL_URL ?? "http://localhost:8080/payment-cancel",
};
