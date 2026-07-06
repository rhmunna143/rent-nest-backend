import express, { type Express, type Request, type Response } from "express";
import { config } from "./config/index.js";
import { userRouter } from "./modules/user/user.route.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! The server is running.");
});

export default app;
