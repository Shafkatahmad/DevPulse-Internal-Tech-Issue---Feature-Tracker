import type { Request, Response } from "express";
import { userServer } from "./user.server";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userServer.createUserIntoDB(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const userController = {
  createUser,
};
