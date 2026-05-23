import { Router } from "express";
import auth from "../middleware/auth";
import { issuesController } from "./issues.controller";

const router = Router();

router.post("/", auth(), issuesController.createIssue);
router.get("/", issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.put("/:id", issuesController.updateIssue);
router.delete("/:id", issuesController.deleteIssue);

export const issuesRoute = router;
