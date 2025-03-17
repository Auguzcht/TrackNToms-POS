import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Helper function to create database connections
// Now using environment variables with fallbacks for XAMPP
const createConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trackntoms',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    // Remove SSL configuration for local development
    // If needed, conditionally add SSL based on NODE_ENV
  });
};

// Enhanced test-db-connection route with detailed diagnostics
router.get('/test-db-connection', async (req, res) => {
  let connection;
  try {
    console.log('Testing database connection...');
    connection = await createConnection();
    
    // Basic connectivity test
    const [result] = await connection.query('SELECT 1 as value');
    console.log('Database connection test result:', result);
    
    // Get additional server information
    const [serverInfo] = await connection.query(`
      SELECT 
        VERSION() as version,
        @@character_set_database as charset,
        @@collation_database as collation,
        DATABASE() as current_db
    `);
    
    console.log('Database server info:', serverInfo[0]);

    res.json({ 
      connected: true,
      message: 'Successfully connected to database',
      serverInfo: serverInfo[0]
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Provide helpful error messages for common connection issues
    let errorMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please ensure MySQL/XAMPP is running.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Access denied. Please check your database username and password.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = `Database '${process.env.DB_NAME || 'trackntoms'}' does not exist. Please create it first.`;
    }
    
    res.status(500).json({
      connected: false,
      error: errorMessage,
      code: error.code
    });
  } finally {
    if (connection) await connection.end();
  }
});

// Setup database route - creates tables and adds sample data
router.get('/setup-database', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    console.log('Setting up database...');
    
    // Check if tables exist, get the SQL from the file if needed
    const [tables] = await connection.query('SHOW TABLES');
    const tableCount = tables.length;
    
    if (tableCount === 0) {
      console.log('No tables found. Creating schema...');
      // This is where you'd execute your SQL schema file
      // For simplicity, we'll just create a few basic tables
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
          ingredient_id INT(11) NOT NULL AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          unit VARCHAR(20) NOT NULL,
          quantity DECIMAL(7,2) NOT NULL DEFAULT 0.00,
          minimum_quantity DECIMAL(7,2) NOT NULL DEFAULT 0.00,
          unit_cost DECIMAL(7,2) NOT NULL DEFAULT 0.00,
          last_restock_date DATE DEFAULT NULL,
          image VARCHAR(255) DEFAULT NULL,
          PRIMARY KEY (ingredient_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      
      // Add other essential tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS items (
          item_id INT(11) NOT NULL AUTO_INCREMENT,
          item_name VARCHAR(100) NOT NULL,
          category ENUM('Coffee','Pastries','Food','Utensils','Add Ons','Drinks') NOT NULL,
          base_price DECIMAL(7,2) NOT NULL,
          description TEXT DEFAULT NULL,
          image VARCHAR(255) DEFAULT NULL,
          is_externally_sourced TINYINT(1) DEFAULT 0,
          PRIMARY KEY (item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS item_ingredients (
          item_id INT(11) NOT NULL,
          ingredient_id INT(11) NOT NULL,
          quantity DECIMAL(6,2) NOT NULL,
          PRIMARY KEY (item_id, ingredient_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      
      console.log('Basic schema created');
    }
    
    // Check if we need to add sample data
    const [ingredientCount] = await connection.query('SELECT COUNT(*) as count FROM ingredients');
    
    if (ingredientCount[0].count === 0) {
      console.log('Adding sample ingredients...');
      await connection.query(`
        INSERT INTO ingredients (name, unit, quantity, minimum_quantity, unit_cost, last_restock_date) 
        VALUES 
          ('Coffee Beans', 'kg', 10.0, 2.0, 450.00, CURDATE()),
          ('Milk', 'L', 20.0, 5.0, 85.00, CURDATE()),
          ('Sugar', 'kg', 5.0, 1.0, 65.00, CURDATE()),
          ('Chocolate Syrup', 'bottle', 8, 2, 120.00, CURDATE())
      `);
    }
    
    const [itemCount] = await connection.query('SELECT COUNT(*) as count FROM items');
    
    if (itemCount[0].count === 0) {
      console.log('Adding sample menu items...');
      await connection.query(`
        INSERT INTO items (item_name, category, base_price, description) 
        VALUES 
          ('Espresso', 'Coffee', 95.00, 'Strong black coffee'),
          ('Caffe Latte', 'Coffee', 120.00, 'Coffee with steamed milk'),
          ('Chocolate Croissant', 'Pastries', 85.00, 'Buttery croissant with chocolate filling')
      `);
    }
    
    // Get current counts for the response
    const [ingredients] = await connection.query('SELECT COUNT(*) as count FROM ingredients');
    const [items] = await connection.query('SELECT COUNT(*) as count FROM items');
    
    res.json({
      success: true,
      message: 'Database setup completed successfully',
      tableCount: tables.length,
      data: {
        ingredients: ingredients[0].count,
        items: items[0].count
      }
    });
    
  } catch (error) {
    console.error('Failed to setup database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    if (connection) await connection.end();
  }
});

// INGREDIENTS ROUTES
// Get all ingredients
router.get('/inventory/ingredients', async (req, res) => {
  let connection;
  try {
    console.log('Fetching ingredients');
    connection = await createConnection();
    const [ingredients] = await connection.query('SELECT * FROM ingredients');
    console.log(`Retrieved ${ingredients.length} ingredients`);
    res.json(ingredients);
  } catch (error) {
    console.error('Failed to fetch ingredients:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get ingredient by ID
router.get('/inventory/ingredients/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [ingredients] = await connection.query(
      'SELECT * FROM ingredients WHERE ingredient_id = ?',
      [req.params.id]
    );
    
    if (ingredients.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.json(ingredients[0]);
  } catch (error) {
    console.error(`Failed to fetch ingredient ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Create new ingredient
router.post('/inventory/ingredients', async (req, res) => {
  let connection;
  try {
    const { name, unit, quantity, minimum_quantity, unit_cost, image } = req.body;
    connection = await createConnection();
    
    const [result] = await connection.query(
      `INSERT INTO ingredients (name, unit, quantity, minimum_quantity, unit_cost, last_restock_date, image) 
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,

      [name, unit, quantity || 0, minimum_quantity || 0, unit_cost || 0, image]
    );
    
    const [newIngredient] = await connection.query(
      'SELECT * FROM ingredients WHERE ingredient_id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newIngredient[0]);
  } catch (error) {
    console.error('Failed to create ingredient:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update ingredient
router.put('/inventory/ingredients/:id', async (req, res) => {
  let connection;
  try {
    const { name, unit, quantity, minimum_quantity, unit_cost, image } = req.body;
    connection = await createConnection();
    
    await connection.query(
      `UPDATE ingredients 
       SET name = ?, unit = ?, quantity = ?, minimum_quantity = ?, unit_cost = ?, image = ?
       WHERE ingredient_id = ?`,
      [name, unit, quantity, minimum_quantity, unit_cost, image, req.params.id]
    );
    
    const [updatedIngredient] = await connection.query(
      'SELECT * FROM ingredients WHERE ingredient_id = ?',
      [req.params.id]
    );
    
    if (updatedIngredient.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.json(updatedIngredient[0]);
  } catch (error) {
    console.error(`Failed to update ingredient ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete ingredient
router.delete('/inventory/ingredients/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    await connection.query(
      'DELETE FROM ingredients WHERE ingredient_id = ?',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete ingredient ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// ITEMS ROUTES
// Get all items
router.get('/inventory/items', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [items] = await connection.query('SELECT * FROM items');
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get item by ID
router.get('/inventory/items/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [items] = await connection.query(
      'SELECT * FROM items WHERE item_id = ?',
      [req.params.id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const [ingredients] = await connection.query(
      `SELECT i.ingredient_id, i.name, i.unit, ii.quantity 
       FROM item_ingredients ii
       JOIN ingredients i ON ii.ingredient_id = i.ingredient_id
       WHERE ii.item_id = ?`,
      [req.params.id]
    );
    
    const item = {
      ...items[0],
      ingredients: ingredients
    };
    
    res.json(item);
  } catch (error) {
    console.error(`Failed to fetch item ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// PULLOUTS ROUTES
// Get all pullouts
router.get('/inventory/pullouts', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [pullouts] = await connection.query(
      `SELECT p.*, i.name as ingredient_name, i.unit as ingredient_unit
       FROM pullout p
       JOIN ingredients i ON p.ingredient_id = i.ingredient_id
       ORDER BY p.date_of_pullout DESC`
    );
    res.json(pullouts);
  } catch (error) {
    console.error('Failed to fetch pullouts:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Add these routes after the PULLOUTS ROUTES section:

// SUPPLIERS ROUTES
// Get all suppliers
router.get('/suppliers', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [suppliers] = await connection.query('SELECT * FROM supplier');
    console.log(`Retrieved ${suppliers.length} suppliers`);
    res.json(suppliers);
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get supplier by ID
router.get('/suppliers/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [suppliers] = await connection.query(
      'SELECT * FROM supplier WHERE supplier_id = ?',
      [req.params.id]
    );
    
    if (suppliers.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(suppliers[0]);
  } catch (error) {
    console.error(`Failed to fetch supplier ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Create new supplier
router.post('/suppliers', async (req, res) => {
  let connection;
  try {
    const {
      supplier_name,
      supplier_contact,
      supplier_email,
      contact_person,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      payment_terms,
      notes,
      is_active,
      logo
    } = req.body;
    
    connection = await createConnection();
    
    const [result] = await connection.query(
      `INSERT INTO supplier 
       (supplier_name, supplier_contact, supplier_email, contact_person, address, 
        city, state, postal_code, country, website, payment_terms, notes, is_active, logo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supplier_name, supplier_contact, supplier_email, contact_person, address,
       city, state, postal_code, country, website, payment_terms, notes, is_active ? 1 : 0, logo]
    );
    
    const [newSupplier] = await connection.query(
      'SELECT * FROM supplier WHERE supplier_id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newSupplier[0]);
  } catch (error) {
    console.error('Failed to create supplier:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update supplier
router.put('/suppliers/:id', async (req, res) => {
  let connection;
  try {
    const {
      supplier_name,
      supplier_contact,
      supplier_email,
      contact_person,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      payment_terms,
      notes,
      is_active,
      logo
    } = req.body;
    
    connection = await createConnection();
    
    await connection.query(
      `UPDATE supplier SET
       supplier_name = ?, supplier_contact = ?, supplier_email = ?, contact_person = ?,
       address = ?, city = ?, state = ?, postal_code = ?, country = ?,
       website = ?, payment_terms = ?, notes = ?, is_active = ?, logo = ?
       WHERE supplier_id = ?`,
      [supplier_name, supplier_contact, supplier_email, contact_person,
       address, city, state, postal_code, country,
       website, payment_terms, notes, is_active ? 1 : 0, logo,
       req.params.id]
    );
    
    const [updatedSupplier] = await connection.query(
      'SELECT * FROM supplier WHERE supplier_id = ?',
      [req.params.id]
    );
    
    if (updatedSupplier.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(updatedSupplier[0]);
  } catch (error) {
    console.error(`Failed to update supplier ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete supplier
router.delete('/suppliers/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    await connection.query(
      'DELETE FROM supplier WHERE supplier_id = ?',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete supplier ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// CONSIGNMENTS ROUTES
// Get all consignments
router.get('/consignments', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [consignments] = await connection.query(`
      SELECT c.*, s.supplier_name 
      FROM consignment c
      LEFT JOIN supplier s ON c.supplier_id = s.supplier_id
      ORDER BY c.date DESC
    `);
    
    // Get consignment details for each consignment
    for (let consignment of consignments) {
      const [items] = await connection.query(`
        SELECT cd.*, i.item_name
        FROM consignment_details cd
        LEFT JOIN items i ON cd.item_id = i.item_id
        WHERE cd.consignment_id = ?
      `, [consignment.consignment_id]);
      
      consignment.items = items;
    }
    
    res.json(consignments);
  } catch (error) {
    console.error('Failed to fetch consignments:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get consignment by ID
router.get('/consignments/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [consignments] = await connection.query(`
      SELECT c.*, s.supplier_name 
      FROM consignment c
      LEFT JOIN supplier s ON c.supplier_id = s.supplier_id
      WHERE c.consignment_id = ?
    `, [req.params.id]);
    
    if (consignments.length === 0) {
      return res.status(404).json({ error: 'Consignment not found' });
    }
    
    const consignment = consignments[0];
    
    // Get consignment details
    const [items] = await connection.query(`
      SELECT cd.*, i.item_name
      FROM consignment_details cd
      LEFT JOIN items i ON cd.item_id = i.item_id
      WHERE cd.consignment_id = ?
    `, [consignment.consignment_id]);
    
    consignment.items = items;
    
    res.json(consignment);
  } catch (error) {
    console.error(`Failed to fetch consignment ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Create new consignment with transaction
router.post('/consignments', async (req, res) => {
  let connection;
  try {
    const {
      supplier_id,
      date,
      manager_id,
      total,
      items = []
    } = req.body;
    
    if (!supplier_id || !date || !manager_id || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Insert consignment header
    const [headerResult] = await connection.query(
      `INSERT INTO consignment (supplier_id, date, manager_id, total) 
       VALUES (?, ?, ?, ?)`,
      [supplier_id, date, manager_id, total]
    );
    
    const consignment_id = headerResult.insertId;
    
    // Insert consignment details
    for (const item of items) {
      await connection.query(
        `INSERT INTO consignment_details 
         (consignment_id, item_id, quantity, supplier_price, production_date, usa_total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          consignment_id, 
          item.item_id, 
          item.quantity, 
          item.supplier_price,
          item.production_date || null,
          item.usa_total || item.quantity * item.supplier_price
        ]
      );
    }
    
    await connection.commit();
    
    // Fetch the newly created consignment with its details
    const [newConsignment] = await connection.query(
      `SELECT * FROM consignment WHERE consignment_id = ?`,
      [consignment_id]
    );
    
    const [consignmentDetails] = await connection.query(
      `SELECT cd.*, i.item_name
       FROM consignment_details cd
       LEFT JOIN items i ON cd.item_id = i.item_id
       WHERE cd.consignment_id = ?`,
      [consignment_id]
    );
    
    const result = {
      ...newConsignment[0],
      items: consignmentDetails
    };
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create consignment:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update consignment with transaction
router.put('/consignments/:id', async (req, res) => {
  let connection;
  try {
    const {
      supplier_id,
      date,
      manager_id,
      total,
      items = []
    } = req.body;
    
    if (!supplier_id || !date || !manager_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Update consignment header
    await connection.query(
      `UPDATE consignment 
       SET supplier_id = ?, date = ?, manager_id = ?, total = ? 
       WHERE consignment_id = ?`,
      [supplier_id, date, manager_id, total, req.params.id]
    );
    
    // Delete existing consignment details
    await connection.query(
      `DELETE FROM consignment_details WHERE consignment_id = ?`,
      [req.params.id]
    );
    
    // Insert new consignment details
    for (const item of items) {
      await connection.query(
        `INSERT INTO consignment_details 
         (consignment_id, item_id, quantity, supplier_price, production_date, usa_total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.params.id, 
          item.item_id, 
          item.quantity, 
          item.supplier_price,
          item.production_date || null,
          item.usa_total || item.quantity * item.supplier_price
        ]
      );
    }
    
    await connection.commit();
    
    // Fetch the updated consignment with its details
    const [updatedConsignment] = await connection.query(
      `SELECT * FROM consignment WHERE consignment_id = ?`,
      [req.params.id]
    );
    
    if (updatedConsignment.length === 0) {
      return res.status(404).json({ error: 'Consignment not found' });
    }
    
    const [consignmentDetails] = await connection.query(
      `SELECT cd.*, i.item_name
       FROM consignment_details cd
       LEFT JOIN items i ON cd.item_id = i.item_id
       WHERE cd.consignment_id = ?`,
      [req.params.id]
    );
    
    const result = {
      ...updatedConsignment[0],
      items: consignmentDetails
    };
    
    res.json(result);
  } catch (error) {
    console.error(`Failed to update consignment ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete consignment with transaction
router.delete('/consignments/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Delete consignment details first (due to foreign key constraints)
    await connection.query(
      'DELETE FROM consignment_details WHERE consignment_id = ?',
      [req.params.id]
    );
    
    // Delete consignment header
    await connection.query(
      'DELETE FROM consignment WHERE consignment_id = ?',
      [req.params.id]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Consignment deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete consignment ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// PURCHASE ROUTES
// Get all purchases
router.get('/purchases', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [purchases] = await connection.query(`
      SELECT p.*, s.first_name, s.last_name, m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM purchase p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      LEFT JOIN staff m ON p.manager_id = m.staff_id
      ORDER BY p.purchase_date DESC
    `);
    
    // Get purchase details for each purchase
    for (let purchase of purchases) {
      const [items] = await connection.query(`
        SELECT pd.*, i.name as ingredient_name, i.unit as ingredient_unit
        FROM purchase_details pd
        LEFT JOIN ingredients i ON pd.ingredient_id = i.ingredient_id
        WHERE pd.purchase_id = ?
      `, [purchase.purchase_id]);
      
      purchase.items = items;
    }
    
    res.json(purchases);
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get purchase by ID
router.get('/purchases/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [purchases] = await connection.query(`
      SELECT p.*, s.first_name, s.last_name, m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM purchase p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      LEFT JOIN staff m ON p.manager_id = m.staff_id
      WHERE p.purchase_id = ?
    `, [req.params.id]);
    
    if (purchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const purchase = purchases[0];
    
    // Get purchase details
    const [items] = await connection.query(`
      SELECT pd.*, i.name as ingredient_name, i.unit as ingredient_unit
      FROM purchase_details pd
      LEFT JOIN ingredients i ON pd.ingredient_id = i.ingredient_id
      WHERE pd.purchase_id = ?
    `, [purchase.purchase_id]);
    
    purchase.items = items;
    
    res.json(purchase);
  } catch (error) {
    console.error(`Failed to fetch purchase ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Create new purchase with transaction
router.post('/purchases', async (req, res) => {
  let connection;
  try {
    const {
      staff_id,
      manager_id,
      purchase_date,
      total_amount,
      items = []
    } = req.body;
    
    if (!staff_id || !purchase_date || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Insert purchase header
    const [headerResult] = await connection.query(
      `INSERT INTO purchase (staff_id, manager_id, purchase_date, total_amount) 
       VALUES (?, ?, ?, ?)`,
      [staff_id, manager_id, purchase_date, total_amount]
    );
    
    const purchase_id = headerResult.insertId;
    
    // Insert purchase details and update ingredient quantities
    for (const item of items) {
      await connection.query(
        `INSERT INTO purchase_details 
         (purchase_id, ingredient_id, quantity, unit_price, subtotal, product_expiration_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          purchase_id, 
          item.ingredient_id, 
          item.quantity, 
          item.unit_price,
          item.subtotal || item.quantity * item.unit_price,
          item.product_expiration_date || null
        ]
      );
      
      // Update ingredient quantity and last_restock_date
      await connection.query(
        `UPDATE ingredients 
         SET quantity = quantity + ?, last_restock_date = ? 
         WHERE ingredient_id = ?`,
        [item.quantity, purchase_date, item.ingredient_id]
      );
    }
    
    await connection.commit();
    
    // Fetch the newly created purchase with its details
    const [newPurchase] = await connection.query(
      `SELECT * FROM purchase WHERE purchase_id = ?`,
      [purchase_id]
    );
    
    const [purchaseDetails] = await connection.query(
      `SELECT pd.*, i.name as ingredient_name, i.unit as ingredient_unit
       FROM purchase_details pd
       LEFT JOIN ingredients i ON pd.ingredient_id = i.ingredient_id
       WHERE pd.purchase_id = ?`,
      [purchase_id]
    );
    
    const result = {
      ...newPurchase[0],
      items: purchaseDetails
    };
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create purchase:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update purchase with transaction
router.put('/purchases/:id', async (req, res) => {
  let connection;
  try {
    const {
      staff_id,
      manager_id,
      purchase_date,
      total_amount,
      items = []
    } = req.body;
    
    if (!staff_id || !purchase_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Get current purchase details to reverse quantity changes
    const [currentDetails] = await connection.query(
      `SELECT pd.*, i.quantity as current_stock
       FROM purchase_details pd
       JOIN ingredients i ON pd.ingredient_id = i.ingredient_id
       WHERE pd.purchase_id = ?`,
      [req.params.id]
    );
    
    // Reverse the old quantities
    for (const detail of currentDetails) {
      await connection.query(
        `UPDATE ingredients 
         SET quantity = quantity - ? 
         WHERE ingredient_id = ?`,
        [detail.quantity, detail.ingredient_id]
      );
    }
    
    // Update purchase header
    await connection.query(
      `UPDATE purchase 
       SET staff_id = ?, manager_id = ?, purchase_date = ?, total_amount = ? 
       WHERE purchase_id = ?`,
      [staff_id, manager_id, purchase_date, total_amount, req.params.id]
    );
    
    // Delete existing purchase details
    await connection.query(
      `DELETE FROM purchase_details WHERE purchase_id = ?`,
      [req.params.id]
    );
    
    // Insert new purchase details and update ingredient quantities
    for (const item of items) {
      await connection.query(
        `INSERT INTO purchase_details 
         (purchase_id, ingredient_id, quantity, unit_price, subtotal, product_expiration_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.params.id, 
          item.ingredient_id, 
          item.quantity, 
          item.unit_price,
          item.subtotal || item.quantity * item.unit_price,
          item.product_expiration_date || null
        ]
      );
      
      // Update ingredient quantity and last_restock_date
      await connection.query(
        `UPDATE ingredients 
         SET quantity = quantity + ?, last_restock_date = ? 
         WHERE ingredient_id = ?`,
        [item.quantity, purchase_date, item.ingredient_id]
      );
    }
    
    await connection.commit();
    
    // Fetch the updated purchase with its details
    const [updatedPurchase] = await connection.query(
      `SELECT * FROM purchase WHERE purchase_id = ?`,
      [req.params.id]
    );
    
    if (updatedPurchase.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    const [purchaseDetails] = await connection.query(
      `SELECT pd.*, i.name as ingredient_name, i.unit as ingredient_unit
       FROM purchase_details pd
       LEFT JOIN ingredients i ON pd.ingredient_id = i.ingredient_id
       WHERE pd.purchase_id = ?`,
      [req.params.id]
    );
    
    const result = {
      ...updatedPurchase[0],
      items: purchaseDetails
    };
    
    res.json(result);
  } catch (error) {
    console.error(`Failed to update purchase ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete purchase with transaction
router.delete('/purchases/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Get purchase details to reverse the quantity changes
    const [purchaseDetails] = await connection.query(
      `SELECT * FROM purchase_details WHERE purchase_id = ?`,
      [req.params.id]
    );
    
    // Reverse ingredient quantity changes
    for (const detail of purchaseDetails) {
      await connection.query(
        `UPDATE ingredients 
         SET quantity = quantity - ? 
         WHERE ingredient_id = ?`,
        [detail.quantity, detail.ingredient_id]
      );
    }
    
    // Delete purchase details first (due to foreign key constraints)
    await connection.query(
      'DELETE FROM purchase_details WHERE purchase_id = ?',
      [req.params.id]
    );
    
    // Delete purchase header
    await connection.query(
      'DELETE FROM purchase WHERE purchase_id = ?',
      [req.params.id]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete purchase ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Complete the PULLOUT ROUTES
// Create new pullout with transaction
router.post('/inventory/pullouts', async (req, res) => {
  let connection;
  try {
    const {
      ingredient_id,
      staff_id,
      manager_id,
      quantity,
      reason,
      date_of_pullout = new Date().toISOString().slice(0, 10)
    } = req.body;
    
    if (!ingredient_id || !staff_id || !manager_id || !quantity || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Check if we have enough stock
    const [ingredientData] = await connection.query(
      'SELECT quantity FROM ingredients WHERE ingredient_id = ?',
      [ingredient_id]
    );
    
    if (ingredientData.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    if (ingredientData[0].quantity < quantity) {
      return res.status(400).json({ 
        error: 'Not enough stock available',
        available: ingredientData[0].quantity
      });
    }
    
    // Create pullout record
    const [result] = await connection.query(
      `INSERT INTO pullout 
       (ingredient_id, staff_id, manager_id, quantity, reason, date_of_pullout) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ingredient_id, staff_id, manager_id, quantity, reason, date_of_pullout]
    );
    
    // Update ingredient quantity
    await connection.query(
      'UPDATE ingredients SET quantity = quantity - ? WHERE ingredient_id = ?',
      [quantity, ingredient_id]
    );
    
    await connection.commit();
    
    // Fetch the newly created pullout record
    const [newPullout] = await connection.query(
      `SELECT p.*, i.name as ingredient_name, i.unit as ingredient_unit
       FROM pullout p
       JOIN ingredients i ON p.ingredient_id = i.ingredient_id
       WHERE p.pullout_id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newPullout[0]);
  } catch (error) {
    console.error('Failed to create pullout record:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update pullout with transaction
router.put('/inventory/pullouts/:id', async (req, res) => {
  let connection;
  try {
    const {
      ingredient_id,
      staff_id,
      manager_id,
      quantity,
      reason,
      date_of_pullout
    } = req.body;
    
    if (!ingredient_id || !staff_id || !manager_id || !quantity || !reason || !date_of_pullout) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Get current pullout details to reverse quantity changes
    const [currentPullout] = await connection.query(
      'SELECT * FROM pullout WHERE pullout_id = ?',
      [req.params.id]
    );
    
    if (currentPullout.length === 0) {
      return res.status(404).json({ error: 'Pullout record not found' });
    }
    
    const oldPullout = currentPullout[0];
    
    // Reverse the old quantity change
    await connection.query(
      'UPDATE ingredients SET quantity = quantity + ? WHERE ingredient_id = ?',
      [oldPullout.quantity, oldPullout.ingredient_id]
    );
    
    // Check if we have enough stock for the new quantity
    if (oldPullout.ingredient_id !== ingredient_id) {
      // We're changing the ingredient, so check the new one's stock
      const [ingredientData] = await connection.query(
        'SELECT quantity FROM ingredients WHERE ingredient_id = ?',
        [ingredient_id]
      );
      
      if (ingredientData.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'New ingredient not found' });
      }
      
      if (ingredientData[0].quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Not enough stock available for new ingredient',
          available: ingredientData[0].quantity
        });
      }
    } else {
      // Same ingredient, check the stock with the reverted quantity
      const [ingredientData] = await connection.query(
        'SELECT quantity FROM ingredients WHERE ingredient_id = ?',
        [ingredient_id]
      );
      
      if (ingredientData[0].quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Not enough stock available',
          available: ingredientData[0].quantity
        });
      }
    }
    
    // Update pullout record
    await connection.query(
      `UPDATE pullout 
       SET ingredient_id = ?, staff_id = ?, manager_id = ?, quantity = ?, reason = ?, date_of_pullout = ?
       WHERE pullout_id = ?`,
      [ingredient_id, staff_id, manager_id, quantity, reason, date_of_pullout, req.params.id]
    );
    
    // Apply new quantity change
    await connection.query(
      'UPDATE ingredients SET quantity = quantity - ? WHERE ingredient_id = ?',
      [quantity, ingredient_id]
    );
    
    await connection.commit();
    
    // Fetch the updated pullout record
    const [updatedPullout] = await connection.query(
      `SELECT p.*, i.name as ingredient_name, i.unit as ingredient_unit
       FROM pullout p
       JOIN ingredients i ON p.ingredient_id = i.ingredient_id
       WHERE p.pullout_id = ?`,
      [req.params.id]
    );
    
    res.json(updatedPullout[0]);
  } catch (error) {
    console.error(`Failed to update pullout ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete pullout with transaction
router.delete('/inventory/pullouts/:id', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();
    
    // Get pullout details to reverse the quantity changes
    const [pulloutData] = await connection.query(
      'SELECT * FROM pullout WHERE pullout_id = ?',
      [req.params.id]
    );
    
    if (pulloutData.length === 0) {
      return res.status(404).json({ error: 'Pullout record not found' });
    }
    
    // Restore ingredient quantity
    await connection.query(
      'UPDATE ingredients SET quantity = quantity + ? WHERE ingredient_id = ?',
      [pulloutData[0].quantity, pulloutData[0].ingredient_id]
    );
    
    // Delete pullout record
    await connection.query(
      'DELETE FROM pullout WHERE pullout_id = ?',
      [req.params.id]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Pullout record deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete pullout ${req.params.id}:`, error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Update this endpoint to properly check availability
router.get('/inventory/items/:id/ingredients/availability', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const itemId = req.params.id;
    const quantity = parseInt(req.query.quantity) || 1;

    // First check if item exists
    const [items] = await connection.query(
      'SELECT * FROM items WHERE item_id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.json({
        available: false,
        message: 'Item not found'
      });
    }

    // Check if item is externally sourced
    if (items[0].is_externally_sourced === 1) {
      return res.json({
        available: true,
        message: 'Item is externally sourced'
      });
    }

    // Get ingredients and check availability
    const [itemIngredients] = await connection.query(
      `SELECT ii.ingredient_id, ii.quantity as required_quantity, 
              i.name, i.quantity as available_quantity, i.unit
       FROM item_ingredients ii
       JOIN ingredients i ON ii.ingredient_id = i.ingredient_id
       WHERE ii.item_id = ?`,
      [itemId]
    );

    if (itemIngredients.length === 0) {
      return res.json({
        available: true,
        message: 'No ingredients required'
      });
    }

    // Check each ingredient
    const unavailableIngredients = itemIngredients.filter(ingredient => {
      const totalRequired = ingredient.required_quantity * quantity;
      return ingredient.available_quantity < totalRequired;
    });

    if (unavailableIngredients.length > 0) {
      return res.json({
        available: false,
        message: `Insufficient ingredients: ${unavailableIngredients.map(i => i.name).join(', ')}`,
        details: unavailableIngredients.map(i => ({
          name: i.name,
          required: i.required_quantity * quantity,
          available: i.available_quantity,
          unit: i.unit
        }))
      });
    }

    return res.json({
      available: true,
      message: 'All ingredients available'
    });

  } catch (error) {
    console.error('Failed to check ingredient availability:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Deduct ingredients after sale
router.post('/inventory/deduct-ingredients', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();
    
    const { items } = req.body;
    const deductions = [];

    for (const item of items) {
      // Get item ingredients
      const [ingredients] = await connection.query(
        `SELECT ii.ingredient_id, ii.quantity as required_quantity, 
                i.quantity as available_quantity, i.name
         FROM item_ingredients ii
         JOIN ingredients i ON ii.ingredient_id = i.ingredient_id
         WHERE ii.item_id = ?`,
        [item.item_id]
      );

      // Calculate and check deductions
      for (const ingredient of ingredients) {
        const deductionAmount = ingredient.required_quantity * item.quantity;
        
        if (ingredient.available_quantity < deductionAmount) {
          await connection.rollback();
          return res.status(400).json({
            error: `Insufficient stock for ${ingredient.name}`,
            required: deductionAmount,
            available: ingredient.available_quantity
          });
        }

        // Update ingredient quantity
        await connection.query(
          'UPDATE ingredients SET quantity = quantity - ? WHERE ingredient_id = ?',
          [deductionAmount, ingredient.ingredient_id]
        );

        deductions.push({
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          quantity: deductionAmount
        });
      }
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Ingredients deducted successfully',
      deductions 
    });

  } catch (error) {
    console.error('Failed to deduct ingredients:', error);
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

router.get('/inventory/stock-levels', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.query(
      `SELECT item_id, quantity FROM inventory_stock`
    );
    
    // Convert array to object for easier lookup
    const stockLevels = {};
    results.forEach(item => {
      stockLevels[item.item_id] = {
        quantity: item.quantity
      };
    });
    
    res.json(stockLevels);
  } catch (error) {
    console.error('Failed to fetch stock levels:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

router.get('/inventory/items/:id/stock-check', async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const [stock] = await connection.query(
      `SELECT quantity FROM inventory_stock WHERE item_id = ?`,
      [req.params.id]
    );
    
    if (stock.length === 0) {
      return res.json({
        available: false,
        message: 'Item not found in inventory'
      });
    }
    
    res.json({
      available: stock[0].quantity > 0,
      quantity: stock[0].quantity,
      message: stock[0].quantity > 0 ? 'Item available' : 'Item out of stock'
    });
  } catch (error) {
    console.error('Failed to check stock:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

export default router;