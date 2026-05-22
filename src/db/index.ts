import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connection_string,
});

export const initDB = async () => {
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
