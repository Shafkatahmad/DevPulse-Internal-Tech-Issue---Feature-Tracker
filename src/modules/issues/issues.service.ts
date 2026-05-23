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

const getSingleIssueFromDB = async (id: string) => {
  // 1. Get the issue
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id],
  );

  const issue = issueResult.rows[0];

  // If not found
  if (!issue) {
    return null;
  }

  // 2. Get reporter
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0] || null;

  // 3. Build final response object
  const enrichedIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return enrichedIssue;
};

const updateIssueIntoDB = async (payload: issue, req: Request, id: string) => {
  const { title, description, type } = payload;
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  const issue = issueResult.rows[0];

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const token = req.headers.authorization;
  if (!token) {
    throw new Error("Unauthorized access");
  }
  const decoded = jwt.verify(
    token as string,
    config.access_token_secret as string,
  ) as JwtPayload;

  const userResult = await pool.query(
    `
    SELECT * FROM users WHERE id=$1
    `,
    [decoded.id],
  );

  const logInUser = userResult.rows[0];

  if (!logInUser) {
    throw new Error("User not found");
  }

  if (logInUser.role === "contributor") {
    if (issue.reporter_id !== logInUser.id) {
      throw new Error("You are not authorized to update this issue");
    }

    if (issue.status !== "open") {
      throw new Error(
        "Contributors can update issues only when status is open",
      );
    }
  }

  const updateResult = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [title, description, type, id],
  );

  return updateResult.rows[0];
};

const deleteIssueFromDB = async (req: Request, id: string) => {
  const token = req.headers.authorization;

  if (!token) {
    throw new Error("Unauthorized access");
  }

  const decoded = jwt.verify(
    token as string,
    config.access_token_secret as string,
  ) as JwtPayload;

  if (decoded.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }

  const result = await pool.query(
    `
    DELETE FROM issues WHERE id = $1 RETURNING *
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue id doesn't exist");
  }

  return result;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};
