const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS encrypted_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized: encrypted_messages table is ready.');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL database:', error.message);
    console.error('Ensure that MySQL is running on localhost and the secure_chat database exists.');
  }
}

module.exports = {
  pool,
  initDB
};
