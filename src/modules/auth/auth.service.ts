import { pool } from "../../db";
import bcrypt from "bcrypt";
import type { LoginUser } from "./auth.interface";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const loginUserIntoDB = async (payload: LoginUser) => {
  // console.log("user Server");
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );

  if (userData.rows.length === 0) throw new Error("Invalid Credentials");

  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  // console.log(matchPassword);

  if (!matchPassword) throw new Error("Invalid Credentials");

  // Generate jwt token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    config.access_token_secret as string,
    {
      expiresIn: "1d",
    },
  );

  const refreshToken = jwt.sign(
    jwtPayload,
    config.refresh_token_secret as string,
    {
      expiresIn: "10d",
    },
  );

  return { accessToken, refreshToken, user };
};

const generateRefreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized.");
  }

  const decoded = jwt.verify(
    token as string,
    config.refresh_token_secret as string,
  ) as JwtPayload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [decoded.email],
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
    updated_at: user.updated_at,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    config.access_token_secret as string,
    {
      expiresIn: "10d",
    },
  );

  return { accessToken };
};

export const authServer = {
  loginUserIntoDB,
  generateRefreshToken,
};
