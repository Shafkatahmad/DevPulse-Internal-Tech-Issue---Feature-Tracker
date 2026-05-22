import type { NextFunction, Request, Response } from "express";
import jwt, { type DecodeOptions, type JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      const decoded = jwt.decode(
        token as string,
        config.access_token_secret as DecodeOptions,
      ) as JwtPayload;
      // console.log(decoded);

      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [decoded.email],
      );

      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
