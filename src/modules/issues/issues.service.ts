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

const getAllIssuesFromDB = async (query: any) => {
  // const { sort = "newest", type, status } = query;
  function buildIssuesQuery(query: any) {
    const conditions: string[] = [];
    const values: any[] = [];

    if (query.type) {
      values.push(query.type);
      conditions.push(`type = $${values.length}`);
    }

    if (query.status) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }

    let sql = "SELECT * FROM issues";

    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const sort = query.sort === "oldest" ? "ASC" : "DESC";
    sql += ` ORDER BY created_at ${sort}`;

    return { sql, values };
  }
  const { sql, values } = buildIssuesQuery(query);
  const result = await pool.query(sql, values);

  return result;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
