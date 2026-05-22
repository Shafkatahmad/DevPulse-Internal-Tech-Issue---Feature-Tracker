import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING,
  access_token_secret: process.env.JWT_ACCESS_TOKEN,
  refresh_token_secret: process.env.JWT_REFRESH_TOKEN,
};

export default config;
