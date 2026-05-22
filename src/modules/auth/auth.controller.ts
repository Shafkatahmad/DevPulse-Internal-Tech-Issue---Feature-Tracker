import type { Request, Response } from "express";
import { authServer } from "./auth.service";

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authServer.loginUserIntoDB(req.body);

    const { accessToken, refreshToken, user } = result;
    res.cookie("refreshToken", refreshToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user: user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  loginUser,
};
