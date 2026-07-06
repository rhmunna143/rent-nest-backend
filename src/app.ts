import express, { type Express, type Request, type Response } from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { userRouter } from "./modules/user/user.route.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! The server is running.");
});

app.use("/api", userRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
