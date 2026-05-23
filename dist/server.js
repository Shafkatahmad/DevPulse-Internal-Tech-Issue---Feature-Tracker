

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/users/user.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING,
  access_token_secret: process.env.JWT_ACCESS_TOKEN,
  refresh_token_secret: process.env.JWT_REFRESH_TOKEN
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(20) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(15) DEFAULT 'contributor',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        reporter_id INT REFERENCES users(id) ON DELETE CASCADE,

        title VARCHAR(20),
        description VARCHAR(150),
        type VARCHAR(20),
        status VARCHAR(15) DEFAULT 'open',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/users/user.server.ts
import bcrypt from "bcrypt";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var userServer = {
  createUserIntoDB
};

// src/modules/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/users/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userServer.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser
};

// src/modules/users/user.route.ts
var router = Router();
router.post("/", userController.createUser);
var userRoute = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcrypt";
import jwt from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) throw new Error("Invalid Credentials");
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) throw new Error("Invalid Credentials");
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  const accessToken = jwt.sign(
    jwtPayload,
    config_default.access_token_secret,
    {
      expiresIn: "1d"
    }
  );
  const refreshToken2 = jwt.sign(
    jwtPayload,
    config_default.refresh_token_secret,
    {
      expiresIn: "10d"
    }
  );
  return { accessToken, refreshToken: refreshToken2, user };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized.");
  }
  const decoded = jwt.verify(
    token,
    config_default.refresh_token_secret
  );
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [decoded.email]
  );
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  const accessToken = jwt.sign(
    jwtPayload,
    config_default.access_token_secret,
    {
      expiresIn: "10d"
    }
  );
  return { accessToken };
};
var authServer = {
  loginUserIntoDB,
  generateRefreshToken
};

// src/modules/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authServer.loginUserIntoDB(req.body);
    const { accessToken, refreshToken: refreshToken2, user } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user
      }
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authServer.generateRefreshToken(
      req.cookies.refreshToken
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Access Token Generated.",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/", authController.loginUser);
router2.post("/refresh-token", authController.refreshToken);
var authRoute = router2;

// src/modules/issues/issues.route.ts
import { Router as Router3 } from "express";

// src/modules/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = () => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.access_token_secret
      );
      if (!decoded) throw new Error("Invalid credentials!");
      next();
    } catch (error) {
      next(new Error("Invalid Credentials!"));
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.service.ts
import jwt3 from "jsonwebtoken";
var createIssueIntoDB = async (payload, req) => {
  const { title, description, type } = payload;
  const token = req.headers.authorization;
  const decoded = jwt3.verify(
    token,
    config_default.access_token_secret
  );
  const result = await pool.query(
    `
    INSERT INTO issues(reporter_id, title, description, type) VALUES($1, $2, $3, $4) RETURNING *
    `,
    [decoded.id, title, description, type]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  function buildIssuesQuery(query2) {
    const conditions = [];
    const values2 = [];
    if (query2.type) {
      values2.push(query2.type);
      conditions.push(`type = $${values2.length}`);
    }
    if (query2.status) {
      values2.push(query2.status);
      conditions.push(`status = $${values2.length}`);
    }
    let sql2 = "SELECT * FROM issues";
    if (conditions.length) {
      sql2 += " WHERE " + conditions.join(" AND ");
    }
    const sort = query2.sort === "oldest" ? "ASC" : "DESC";
    sql2 += ` ORDER BY created_at ${sort}`;
    return { sql: sql2, values: values2 };
  }
  const { sql, values } = buildIssuesQuery(query);
  const issuesResult = await pool.query(sql, values);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const reportersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const reporterMap = /* @__PURE__ */ new Map();
  for (const user of reportersResult.rows) {
    reporterMap.set(user.id, user);
  }
  const enrichedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return enrichedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    return null;
  }
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0] || null;
  const enrichedIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return enrichedIssue;
};
var updateIssueIntoDB = async (payload, req, id) => {
  const { title, description, type } = payload;
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const token = req.headers.authorization;
  if (!token) {
    throw new Error("Unauthorized access");
  }
  const decoded = jwt3.verify(
    token,
    config_default.access_token_secret
  );
  const userResult = await pool.query(
    `
    SELECT * FROM users WHERE id=$1
    `,
    [decoded.id]
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
        "Contributors can update issues only when status is open"
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
    [title, description, type, id]
  );
  return updateResult.rows[0];
};
var deleteIssueFromDB = async (req, id) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new Error("Unauthorized access");
  }
  const decoded = jwt3.verify(
    token,
    config_default.access_token_secret
  );
  if (decoded.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id = $1 RETURNING *
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue id doesn't exist");
  }
  return result;
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issuesService.createIssueIntoDB(req.body, req);
    sendResponse_default(res, {
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
        updated_at: result.updated_at
      }
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const query = req.query;
    const result = await issuesService.getAllIssuesFromDB(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getSingleIssueFromDB(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No issue with this id",
        data: null
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.updateIssueIntoDB(
      req.body,
      req,
      id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.deleteIssueFromDB(req, id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.route.ts
var router3 = Router3();
router3.post("/", auth_default(), issuesController.createIssue);
router3.get("/", issuesController.getAllIssues);
router3.get("/:id", issuesController.getSingleIssue);
router3.put("/:id", issuesController.updateIssue);
router3.delete("/:id", issuesController.deleteIssue);
var issuesRoute = router3;

// src/modules/middleware/globalErrorHandler.ts
var globalErrorHandler = (error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: error.message || "Internal Servel Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
import CookieParser from "cookie-parser";
var app = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth/signup", userRoute);
app.use("/api/issues", issuesRoute);
app.use("/api/auth/login", authRoute);
app.use(globalErrorHandler_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to DevPulse Server"
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  app_default.listen(config_default.port, () => {
    initDB();
    console.log(`DevPulse app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map