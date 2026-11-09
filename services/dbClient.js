const mysql = require("mysql2/promise");
const { URL } = require("url");

// Get database connection URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Please configure it in Render Environment Variables."
  );
}

// Parse connection URL
const dbUrl = new URL(databaseUrl.replace(/^"|"$/g, ""));

// MySQL / TiDB configuration
const config = {
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : 4000,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),

  // Required for TiDB Cloud Serverless
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(config);

module.exports = pool;