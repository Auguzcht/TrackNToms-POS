import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration object with fallback values
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trackntoms',
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
  queueLimit: 0,
  // Only use SSL in production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3'
  } : undefined,
  namedPlaceholders: true,
  dateStrings: true,
  // Add connection debugging in development
  debug: process.env.NODE_ENV !== 'production' && process.env.DB_DEBUG === 'true' ? ['ComQueryPacket', 'RowDataPacket'] : false,
  // Character encoding
  charset: 'utf8mb4'
};

// Log database connection configuration in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('Database Configuration:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    ssl: dbConfig.ssl ? 'Enabled' : 'Disabled'
  });
}

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Enhanced test connection function with more detailed output
export const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Test with a simple query
    const [result] = await connection.query('SELECT 1 AS connection_test');
    
    // Get server info
    const [serverInfo] = await connection.query('SELECT VERSION() AS version, @@character_set_database AS charset, @@collation_database AS collation');
    
    console.log('✓ Database connection established successfully!');
    console.log(`  - Server Version: ${serverInfo[0].version}`);
    console.log(`  - Character Set: ${serverInfo[0].charset}`);
    console.log(`  - Collation: ${serverInfo[0].collation}`);
    
    return {
      success: true,
      version: serverInfo[0].version,
      charset: serverInfo[0].charset,
      collation: serverInfo[0].collation
    };
  } catch (error) {
    console.error('✗ Failed to connect to database:', error.message);
    
    // Provide more helpful error messages for common issues
    if (error.code === 'ECONNREFUSED') {
      console.error('  Make sure XAMPP MySQL service is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  Check your database username and password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`  Database '${dbConfig.database}' does not exist`);
      console.error('  Create it first using phpMyAdmin or MySQL CLI');
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  } finally {
    if (connection) connection.release();
  }
};

// Add a graceful shutdown function
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
    return true;
  } catch (error) {
    console.error('Error closing database pool:', error);
    return false;
  }
};

// Helper function to execute queries with automatic connection handling
export const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    if (connection) connection.release();
  }
};

// Helper function to execute transactions
export const transaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export default pool;