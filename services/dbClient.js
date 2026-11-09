const mysql = require('mysql2/promise');
const { URL } = require('url');

// Parse DATABASE_URL (MySQL/TiDB style) into a config object for mysql2
// Example: mysql://user:pass@host:4000/database
const dbUrl = new URL(process.env.DATABASE_URL.replace(/^"|"$/g, ''));
const config = {
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(config);

module.exports = pool;

