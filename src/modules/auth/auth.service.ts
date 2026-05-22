import { pool } from "../../db";
import bcrypt from "bcrypt";
import type { LoginUser } from "./auth.interface";
import jwt from "jsonwebtoken";
import config from "../../config";

const loginUserIntoDB = async (payload: LoginUser) => {
  // console.log("user Server");
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT id, name, password, role FROM users WHERE email=$1
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
    role: user.role,
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

  return { accessToken, refreshToken };
};

export const authServer = {
  loginUserIntoDB,
};
