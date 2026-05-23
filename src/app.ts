import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRoute } from "./modules/users/user.route";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";
import globalErrorHandler from "./modules/middleware/globalErrorHandler";

const app: Application = express();

// meddlewares
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// exposed endpoints
app.use("/api/auth/signup", userRoute);
app.use("/api/issues", issuesRoute);
app.use("/api/auth/login", authRoute);

// global erorr handler
app.use(globalErrorHandler);

// exponsed sanity check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to DevPulse Server",
  });
});

export default app;
