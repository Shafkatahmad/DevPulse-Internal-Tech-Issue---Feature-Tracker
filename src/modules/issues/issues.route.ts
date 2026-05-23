import { Router } from "express";
import auth from "../middleware/auth";
import { issuesController } from "./issues.controller";

const router = Router();

router.post("/", auth(), issuesController.createIssue);
router.get("/", issuesController.getAllIssues);

export const issuesRoute = router;
