import Stripe from "stripe";
import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

let client: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!config.stripeSecretKey) {
    throw new AppError(
      500,
      "Stripe is not configured (missing STRIPE_SECRET_KEY)",
    );
  }

  client ??= new Stripe(config.stripeSecretKey);
  return client;
};
