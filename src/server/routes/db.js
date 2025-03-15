import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/test-db-connection', async (req, res) => {
  try {
    // Create connection using the public proxy URL
    const connection = await mysql.createConnection({
      host: 'hopper.proxy.rlwy.net', // Use public proxy hostname
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: 20975, // Use public proxy port
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      }
    });

    // Test the connection
    const [result] = await connection.query('SELECT 1 as value');
    console.log('Database connection test result:', result);

    // Close the connection
    await connection.end();

    res.json({ 
      connected: true,
      message: 'Successfully connected to database'
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Add tables route
router.get('/tables', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'hopper.proxy.rlwy.net',
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: 20975,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      }
    });

    // Query to show all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Database tables:', tables);

    res.json({ 
      success: true,
      tables: tables
    });
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    if (connection) await connection.end();
  }
});

export default router;