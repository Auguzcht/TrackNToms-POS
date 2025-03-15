import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration object
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10), // Convert port to number
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add these recommended settings
  ssl: process.env.NODE_ENV === 'production' ? {} : undefined,
  namedPlaceholders: true,
  dateStrings: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Enhanced test connection function
export const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    // Test with a simple query
    await connection.query('SELECT 1');
    console.log('Database connection established successfully!');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  } finally {
    if (connection) connection.release();
  }
};

// Add a graceful shutdown function
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
};

export default pool;