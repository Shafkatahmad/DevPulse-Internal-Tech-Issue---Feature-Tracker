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

  // 1. Get issues
  const { sql, values } = buildIssuesQuery(query);
  const issuesResult = await pool.query(sql, values);
  const issues = issuesResult.rows;

  if (issues.length === 0) {
    return [];
  }

  // 2. Extract unique reporter IDs
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  // 3. Fetch reporters in one query (batch)
  const reportersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds],
  );

  // 4. Create lookup map
  const reporterMap = new Map();

  for (const user of reportersResult.rows) {
    reporterMap.set(user.id, user);
  }

  // 5. Attach reporter object to each issue
  const enrichedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  // 6. Return enriched result
  return enrichedIssues;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
