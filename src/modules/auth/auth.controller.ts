import type { Request, Response } from "express";
import { authServer } from "./auth.service";
import sendResponse from "../utility/sendResponse";

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authServer.loginUserIntoDB(req.body);

    const { accessToken, refreshToken, user } = result;
    res.cookie("refreshToken", refreshToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user: user,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  loginUser,
};
