import type { Request } from "express";
import { pool } from "../../db";
import type { issue } from "./issues.interface";
import jwt, { type DecodeOptions, type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const createIssueIntoDB = async (payload: issue, req: Request) => {
  const { title, description, type } = payload;

  const token = req.headers.authorization;

  const decoded = jwt.verify(
    token as string,
    config.access_token_secret as string,
  ) as JwtPayload;

  const result = await pool.query(
    `
    INSERT INTO issues(reporter_id, title, description, type) VALUES($1, $2, $3, $4) RETURNING *
    `,
    [decoded.id, title, description, type],
  );
  // console.log(result.rows[0]);

  return result.rows[0];
};

export const issuesService = {
  createIssueIntoDB,
};
