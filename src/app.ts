import cookieParser from "cookie-parser";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { categoryRouter } from "./modules/category/category.route.js";
import { paymentRouter } from "./modules/payment/payment.route.js";
import { propertyRouter } from "./modules/property/property.route.js";
import { rentalRequestRouter } from "./modules/rental-request/rentalRequest.route.js";
import { reviewRouter } from "./modules/review/review.route.js";
import { userRouter } from "./modules/user/user.route.js";
import { config } from "./config/index.js";

const app: Express = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

// Stripe webhook must receive the raw body for signature verification,
// so this runs before express.json() (later parsers skip an already-read body).
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! The server is running.");
});

// Landing pages for Stripe Checkout redirects (backend-only project).
app.get("/payment-success", (_req: Request, res: Response) => {
  res.send("Payment successful! You can close this tab.");
});

app.get("/payment-cancel", (_req: Request, res: Response) => {
  res.send("Payment cancelled. You can close this tab and try again.");
});

app.use("/api", userRouter);
app.use("/api", propertyRouter);
app.use("/api", categoryRouter);
app.use("/api", rentalRequestRouter);
app.use("/api", paymentRouter);
app.use("/api", reviewRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
