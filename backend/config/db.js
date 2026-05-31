const mysql2 = require('mysql2');

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'studenti',
  password: process.env.DB_PASSWORD || 'S039C8R7',
  database: process.env.DB_NAME || 'SISIII2026_00000000',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();