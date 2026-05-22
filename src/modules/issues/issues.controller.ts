import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
  const result = await issuesService.createIssueIntoDB(req.body, req);

  res.status(201).json({
    success: true,
    message: "Issue created successfully",
    data: result.rows[0],
  });
};

export const issuesController = {
  createIssue,
};
