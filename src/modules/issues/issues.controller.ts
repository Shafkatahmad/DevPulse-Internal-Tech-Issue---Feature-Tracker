import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../utility/sendResponse";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.createIssueIntoDB(req.body, req);

    // res.status(201).json({
    //   success: true,
    //   message: "Issue created successfully",
    //   data: {
    //     id: result.id,
    //     title: result.title,
    //     description: result.description,
    //     type: result.type,
    //     status: result.status,
    //     reporter_id: result.reporter_id,
    //     created_at: result.created_at,
    //     updated_at: result.updated_at,
    //   },
    // });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: {
        id: result.id,
        title: result.title,
        description: result.description,
        type: result.type,
        status: result.status,
        reporter_id: result.reporter_id,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
    });
  } catch (error: any) {
    // res.status(500).json({
    //   success: false,
    //   message: error.message,
    //   error: error,
    // });
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const result = await issuesService.getAllIssuesFromDB(query);

    // res.status(200).json({
    //   success: true,
    //   data: result,
    // });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    // res.status(500).json({
    //   success: false,
    //   message: error.message,
    //   error: error,
    // });
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issuesService.getSingleIssueFromDB(id as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No issue with this id",
        data: null,
      });
    }

    // return res.status(200).json({
    //   success: true,
    //   message: "Issue retrieved successfully",
    //   data: result,
    // });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    // return res.status(500).json({
    //   success: false,
    //   message: error.message,
    //   error: error,
    // });
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issuesService.updateIssueIntoDB(
      req.body,
      req,
      id as string,
    );

    // return res.status(200).json({
    //   success: true,
    //   message: "Issue updated successfully",
    //   data: result,
    // });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    // return res.status(500).json({
    //   success: false,
    //   message: error.message,
    //   error: error,
    // });
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issuesService.deleteIssueFromDB(req, id as string);

    // return res.status(200).json({
    //   success: true,
    //   message: "Issue deleted successfully",
    // });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    // return res.status(500).json({
    //   success: false,
    //   message: error.message,
    // });
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
