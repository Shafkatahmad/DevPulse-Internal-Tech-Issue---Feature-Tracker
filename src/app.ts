import express, {
  type Application,
  type Request,
  type Response,
} from "express";

const app: Application = express();

// meddlewares
app.use(express.json());
app.use(express.text());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to DevPulse Server",
  });
});

export default app;
