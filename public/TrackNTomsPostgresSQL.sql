-- TrackNToms POS System - Fixed Schema with Role Management
-- Version 2.0.1

-- =============================================
-- STEP 1: Basic Setup - Extensions and Cleanup
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all existing policies
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Drop existing triggers that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- =============================================
-- STEP 2: Core Tables - Create in Proper Order
-- =============================================

-- Roles table - MUST be created BEFORE any trigger functions
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles IMMEDIATELY after creation
INSERT INTO roles (role_name, description) VALUES
('Admin', 'Full system administrator with all permissions'),
('Manager', 'Store manager with elevated permissions'),
('Cashier', 'Point of sale operator'),
('Inventory', 'Inventory management specialist'),
('Supplier', 'External supplier with limited access');

-- Permissions table
CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource_name VARCHAR(50) NOT NULL, -- table/view name
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Staff table - link to auth.users with dynamic roles
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE, -- Link to auth.users
    first_name VARCHAR(50) NOT NULL DEFAULT 'User',
    last_name VARCHAR(50) NOT NULL DEFAULT 'Name',
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'Active',
    last_login TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_price DECIMAL(7,2) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    is_externally_sourced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity DECIMAL(7,2) NOT NULL,
    minimum_quantity DECIMAL(7,2) NOT NULL,
    unit_cost DECIMAL(7,2) NOT NULL,
    last_restock_date DATE,
    image VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE, -- Optional link to auth.users for supplier login
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    website VARCHAR(255),
    payment_terms VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    logo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item_ingredients junction table
CREATE TABLE item_ingredients (
    item_id INTEGER REFERENCES items(item_id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    quantity DECIMAL(6,2) NOT NULL,
    PRIMARY KEY (item_id, ingredient_id)
);

-- Sales header table
CREATE TABLE sales_header (
    sale_id SERIAL PRIMARY KEY,
    cashier_id UUID NOT NULL, -- References auth.users
    sale_date TIMESTAMP NOT NULL,
    manager_id UUID, -- References auth.users for approval
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales detail table
CREATE TABLE sales_detail (
    sale_detail_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales_header(sale_id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(item_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(7,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase table
CREATE TABLE purchase (
    purchase_id SERIAL PRIMARY KEY,
    created_by UUID NOT NULL, -- References auth.users
    approved_by UUID, -- References auth.users
    purchase_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase details table
CREATE TABLE purchase_details (
    purchase_id INTEGER NOT NULL REFERENCES purchase(purchase_id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(7,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    product_expiration_date DATE,
    PRIMARY KEY (purchase_id, ingredient_id)
);

-- Consignment table
CREATE TABLE consignment (
    consignment_id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    date DATE,
    invoice_number VARCHAR(50),
    reference_number VARCHAR(50),
    manager_id UUID, -- References auth.users 
    total DECIMAL(12,2),
    created_by UUID NOT NULL, -- References auth.users
    approved_by UUID, -- References auth.users
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consignment details table
CREATE TABLE consignment_details (
    consignment_id INTEGER NOT NULL REFERENCES consignment(consignment_id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(item_id),
    quantity INTEGER NOT NULL,
    supplier_price DECIMAL(7,2) NOT NULL,
    production_date DATE,
    usa_total DECIMAL(12,2),
    PRIMARY KEY (consignment_id, item_id)
);

-- Pullout table
CREATE TABLE pullout (
    pullout_id SERIAL PRIMARY KEY,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id),
    requested_by UUID NOT NULL, -- References auth.users
    approved_by UUID, -- References auth.users
    quantity DECIMAL(7,2) NOT NULL,
    reason TEXT NOT NULL,
    date_of_pullout DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification system table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema version control
CREATE TABLE schema_versions (
    version_id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- =============================================
-- STEP 3: Create Indexes for Performance
-- =============================================

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role_id);
CREATE INDEX idx_roles_name ON roles(role_name);
CREATE INDEX idx_permissions_resource ON permissions(resource_name);
CREATE INDEX idx_suppliers_company ON suppliers(company_name);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_name ON items(item_name);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_quantity ON ingredients(quantity);
CREATE INDEX idx_sales_header_date ON sales_header(sale_date);
CREATE INDEX idx_sales_header_cashier ON sales_header(cashier_id);
CREATE INDEX idx_purchase_date ON purchase(purchase_date);
CREATE INDEX idx_purchase_status ON purchase(status);
CREATE INDEX idx_consignment_date ON consignment(date);
CREATE INDEX idx_consignment_supplier ON consignment(supplier_id);
CREATE INDEX idx_pullout_date ON pullout(date_of_pullout);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- =============================================
-- STEP 4: Create Helper Functions
-- =============================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up timestamp triggers
CREATE TRIGGER update_staff_timestamp
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_roles_timestamp
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_permissions_timestamp
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_suppliers_timestamp
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_purchase_timestamp
  BEFORE UPDATE ON purchase
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_consignment_timestamp
  BEFORE UPDATE ON consignment
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_notification_id INTEGER;
BEGIN
  INSERT INTO notifications (
    user_id, 
    title, 
    message, 
    link
  ) VALUES (
    p_user_id, 
    p_title, 
    p_message, 
    p_link
  ) RETURNING notification_id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 5: Create Role Management Functions
-- =============================================

-- Function to check user permissions by resource with error handling
CREATE OR REPLACE FUNCTION has_permission(resource_name TEXT, permission_type TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    IF permission_type NOT IN ('view', 'create', 'edit', 'delete') THEN
        RETURN FALSE;
    END IF;
    
    BEGIN
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1
                FROM staff s
                JOIN role_permissions rp ON s.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE s.user_id = auth.uid()
                AND p.resource_name = %L
                AND p.can_%s = TRUE
            )', resource_name, permission_type)
        INTO v_has_permission;
    EXCEPTION WHEN OTHERS THEN
        -- On error, default to false
        v_has_permission := FALSE;
    END;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role with error handling
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    BEGIN
        SELECT r.role_name INTO v_role_name
        FROM staff s
        JOIN roles r ON s.role_id = r.role_id
        WHERE s.user_id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        -- On error, return null
        v_role_name := NULL;
    END;
    
    RETURN v_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role with error handling
CREATE OR REPLACE FUNCTION has_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_role BOOLEAN := FALSE;
BEGIN
    BEGIN
        SELECT EXISTS (
            SELECT 1
            FROM staff s
            JOIN roles r ON s.role_id = r.role_id
            WHERE s.user_id = auth.uid()
            AND r.role_name = role_name
        ) INTO v_has_role;
    EXCEPTION WHEN OTHERS THEN
        -- On error, default to false
        v_has_role := FALSE;
    END;
    
    RETURN v_has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 6: Create Auth Triggers (WITH ERROR HANDLING)
-- =============================================

-- SIMPLIFIED trigger function with error handling and defaults
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
DECLARE
    v_role_id INTEGER;
    v_cashier_role_id INTEGER;
BEGIN
    -- Get the Cashier role id for default
    BEGIN
        SELECT role_id INTO v_cashier_role_id
        FROM roles
        WHERE role_name = 'Cashier'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- If any error, try to get first role
        BEGIN
            SELECT role_id INTO v_cashier_role_id
            FROM roles
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- If still error, set to NULL
            v_cashier_role_id := NULL;
        END;
    END;
    
    -- Try to get role from metadata
    BEGIN
        -- Get role_id based on metadata or default to 'Cashier'
        SELECT role_id INTO v_role_id
        FROM roles
        WHERE role_name = COALESCE(NEW.raw_user_meta_data->>'role', 'Cashier')
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- On any error, use default Cashier role
        v_role_id := v_cashier_role_id;
    END;
    
    -- If role wasn't found, use default
    IF v_role_id IS NULL THEN
        v_role_id := v_cashier_role_id;
    END IF;
    
    -- Create staff record with error handling
    BEGIN
        INSERT INTO staff (
            user_id,
            email,
            first_name,
            last_name,
            role_id,
            status,
            is_active
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
            v_role_id,
            'Active',
            TRUE
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE NOTICE 'Error creating staff record: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified user update function with error handling
CREATE OR REPLACE FUNCTION sync_auth_user() RETURNS TRIGGER AS $$
BEGIN
    -- Handle updates with error handling
    BEGIN
        UPDATE staff 
        SET 
            email = NEW.email,
            updated_at = NOW(),
            last_login = NOW()
        WHERE user_id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't block user update
        RAISE NOTICE 'Error updating staff record: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 7: Audit Trail Functions
-- =============================================

-- Audit trail function
CREATE OR REPLACE FUNCTION audit_trail_func() RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
BEGIN
  BEGIN
    -- Convert the entire row to JSONB
    IF (TG_OP = 'DELETE') THEN
      v_old_data = to_jsonb(OLD);
      v_record_id = (SELECT value FROM jsonb_each(v_old_data) LIMIT 1)::TEXT;
      
      INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
      VALUES (TG_TABLE_NAME::TEXT, v_record_id, 'DELETE', v_old_data, auth.uid());
      RETURN OLD;
    
    ELSIF (TG_OP = 'UPDATE') THEN
      v_old_data = to_jsonb(OLD);
      v_new_data = to_jsonb(NEW);
      v_record_id = (SELECT value FROM jsonb_each(v_new_data) LIMIT 1)::TEXT;
      
      INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
      VALUES (TG_TABLE_NAME::TEXT, v_record_id, 'UPDATE', v_old_data, v_new_data, auth.uid());
      RETURN NEW;
    
    ELSIF (TG_OP = 'INSERT') THEN
      v_new_data = to_jsonb(NEW);
      v_record_id = (SELECT value FROM jsonb_each(v_new_data) LIMIT 1)::TEXT;
      
      INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
      VALUES (TG_TABLE_NAME::TEXT, v_record_id, 'INSERT', v_new_data, auth.uid());
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- On error, just continue without audit logging
    RAISE NOTICE 'Error in audit logging: %', SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up audit triggers
CREATE TRIGGER staff_audit
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE PROCEDURE audit_trail_func();

-- Low stock notification trigger
CREATE OR REPLACE FUNCTION check_ingredient_stock() RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.quantity <= NEW.minimum_quantity AND (OLD IS NULL OR OLD.quantity > OLD.minimum_quantity) THEN
      -- Notify users with inventory management permissions
      INSERT INTO notifications (user_id, title, message, link)
      SELECT 
        s.user_id, 
        'Low Ingredient Stock Alert', 
        'Ingredient "' || NEW.name || '" is running low (' || NEW.quantity || ' ' || NEW.unit || ' remaining)',
        '/ingredients/' || NEW.ingredient_id
      FROM staff s
      JOIN role_permissions rp ON s.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE p.resource_name = 'ingredients' AND p.can_edit = TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- On error, just continue without notification
    RAISE NOTICE 'Error in ingredient stock check: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingredients_stock_check
  AFTER INSERT OR UPDATE ON ingredients
  FOR EACH ROW EXECUTE PROCEDURE check_ingredient_stock();

-- =============================================
-- STEP 8: Insert Default Permissions
-- =============================================

-- Insert default permissions
INSERT INTO permissions (permission_name, resource_name, description, can_view, can_create, can_edit, can_delete) VALUES
-- Staff permissions
('view_staff', 'staff', 'View staff members', TRUE, FALSE, FALSE, FALSE),
('manage_staff', 'staff', 'Manage staff members', TRUE, TRUE, TRUE, TRUE),

-- Role permissions
('view_roles', 'roles', 'View roles', TRUE, FALSE, FALSE, FALSE),
('manage_roles', 'roles', 'Manage roles and permissions', TRUE, TRUE, TRUE, TRUE),

-- Items permissions
('view_items', 'items', 'View menu items', TRUE, FALSE, FALSE, FALSE),
('manage_items', 'items', 'Manage menu items', TRUE, TRUE, TRUE, TRUE),

-- Ingredients permissions
('view_ingredients', 'ingredients', 'View ingredients', TRUE, FALSE, FALSE, FALSE),
('manage_ingredients', 'ingredients', 'Manage ingredients', TRUE, TRUE, TRUE, TRUE),

-- Suppliers permissions
('view_suppliers', 'suppliers', 'View suppliers', TRUE, FALSE, FALSE, FALSE),
('manage_suppliers', 'suppliers', 'Manage suppliers', TRUE, TRUE, TRUE, TRUE),

-- Sales permissions
('view_sales', 'sales', 'View sales records', TRUE, FALSE, FALSE, FALSE),
('create_sales', 'sales', 'Create new sales', TRUE, TRUE, FALSE, FALSE),
('manage_sales', 'sales', 'Manage all sales records', TRUE, TRUE, TRUE, TRUE),

-- Purchase permissions
('view_purchases', 'purchase', 'View purchase records', TRUE, FALSE, FALSE, FALSE),
('create_purchases', 'purchase', 'Create purchase orders', TRUE, TRUE, FALSE, FALSE),
('manage_purchases', 'purchase', 'Manage all purchase records', TRUE, TRUE, TRUE, TRUE),

-- Consignment permissions
('view_consignments', 'consignment', 'View consignment records', TRUE, FALSE, FALSE, FALSE),
('manage_consignments', 'consignment', 'Manage consignments', TRUE, TRUE, TRUE, TRUE),

-- Notifications
('view_all_notifications', 'notifications', 'View all notifications', TRUE, FALSE, FALSE, FALSE);

-- Map permissions to roles
-- Admin role - all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'Admin'),
    permission_id
FROM permissions;

-- Manager role - most permissions except role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'Manager'),
    permission_id
FROM permissions
WHERE permission_name NOT IN ('manage_roles');

-- Cashier role - limited permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'Cashier'),
    permission_id
FROM permissions
WHERE permission_name IN (
    'view_items',
    'view_ingredients',
    'view_suppliers',
    'view_sales',
    'create_sales'
);

-- Inventory role - inventory related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'Inventory'),
    permission_id
FROM permissions
WHERE permission_name IN (
    'view_staff',
    'view_items',
    'view_ingredients',
    'manage_ingredients',
    'view_suppliers',
    'view_purchases',
    'create_purchases',
    'view_consignments'
);

-- Supplier role - supplier related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'Supplier'),
    permission_id
FROM permissions
WHERE permission_name IN (
    'view_items',
    'view_consignments'
);

-- =============================================
-- STEP 9: Set Up Row-Level Security (RLS)
-- =============================================

-- Enable Row Level Security on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pullout ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create a simple fallback policy for authenticated users
CREATE POLICY "Allow all authenticated access temporarily"
ON staff FOR ALL
TO authenticated
USING (true);

-- Create a simple fallback policy for all other tables
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename != 'staff'
    LOOP
        EXECUTE format('
            CREATE POLICY "Allow all authenticated access temporarily"
            ON %I FOR ALL
            TO authenticated
            USING (true);
        ', t.tablename);
    END LOOP;
END
$$;

-- =============================================
-- STEP 10: Create Admin User Creation Functions
-- =============================================

-- Create admin user function (manual, without needing auth)
CREATE OR REPLACE FUNCTION create_admin_user(
    p_email TEXT,
    p_first_name TEXT DEFAULT 'Admin',
    p_last_name TEXT DEFAULT 'User'
) RETURNS TEXT AS $$
DECLARE
    v_admin_role_id INTEGER;
    v_staff_id INTEGER;
BEGIN
    -- Find Admin role_id with error handling
    BEGIN
        SELECT role_id INTO v_admin_role_id
        FROM roles
        WHERE role_name = 'Admin'
        LIMIT 1;
        
        -- If not found, use first role
        IF v_admin_role_id IS NULL THEN
            SELECT role_id INTO v_admin_role_id
            FROM roles
            LIMIT 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error finding Admin role: %', SQLERRM;
    END;
    
    -- Create staff record without requiring auth user
    BEGIN
        INSERT INTO staff (
            email,
            first_name,
            last_name,
            role_id,
            status,
            is_active
        ) VALUES (
            p_email,
            p_first_name,
            p_last_name,
            v_admin_role_id,
            'Active',
            TRUE
        ) RETURNING staff_id INTO v_staff_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating staff record: %', SQLERRM;
    END;
    
    RETURN 'Admin user created with ID: ' || v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link existing auth user to staff record
CREATE OR REPLACE FUNCTION link_auth_user_to_staff(
    p_user_id UUID,
    p_staff_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    BEGIN
        UPDATE staff
        SET user_id = p_user_id
        WHERE staff_id = p_staff_id
        AND user_id IS NULL;
        
        RETURN FOUND;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error linking user to staff: %', SQLERRM;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For initial admin setup via Supabase service key
CREATE OR REPLACE FUNCTION create_initial_admin(
  p_email TEXT,
  p_display_name TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_admin_role_id INTEGER;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract first and last name with error handling
  BEGIN
    v_first_name := split_part(p_display_name, ' ', 1);
    v_last_name := substr(p_display_name, length(v_first_name) + 2);
    
    -- If split failed, use defaults
    IF v_first_name IS NULL OR v_first_name = '' THEN
      v_first_name := 'Admin';
    END IF;
    
    IF v_last_name IS NULL OR v_last_name = '' THEN
      v_last_name := 'User';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_first_name := 'Admin';
    v_last_name := 'User';
  END;
  
  -- Find Admin role_id with error handling
  BEGIN
    SELECT role_id INTO v_admin_role_id
    FROM roles
    WHERE role_name = 'Admin'
    LIMIT 1;
    
    -- If not found, use first role
    IF v_admin_role_id IS NULL THEN
      SELECT role_id INTO v_admin_role_id
      FROM roles
      LIMIT 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If error, create a new Admin role
    INSERT INTO roles (role_name, description)
    VALUES ('Admin', 'Full system administrator with all permissions')
    RETURNING role_id INTO v_admin_role_id;
  END;
  
-- Create or update staff record with error handling
   BEGIN
     INSERT INTO staff (
       user_id,
       email,
       first_name,
       last_name,
       role_id,
       status,
       is_active
     ) VALUES (
       p_user_id,
       p_email,
       v_first_name,
       v_last_name,
       v_admin_role_id,
       'Active',
       TRUE
     )
     ON CONFLICT (user_id) DO UPDATE SET
       email = p_email,
       role_id = v_admin_role_id,
       is_active = TRUE;
   EXCEPTION WHEN OTHERS THEN
     -- If error, try without constraints
     INSERT INTO staff (
       first_name,
       last_name,
       email,
       role_id,
       status,
       is_active
     ) VALUES (
       v_first_name,
       v_last_name,
       p_email,
       v_admin_role_id,
       'Active',
       TRUE
     );
   END;
 
 RETURN p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 11: Create Utility Functions
-- =============================================

-- Function to add a new role with permissions
CREATE OR REPLACE FUNCTION add_role(
   p_role_name TEXT,
   p_description TEXT,
   p_permissions TEXT[]
) RETURNS INTEGER AS $$
DECLARE
   v_role_id INTEGER;
BEGIN
   -- Create the role with error handling
   BEGIN
       INSERT INTO roles (role_name, description)
       VALUES (p_role_name, p_description)
       RETURNING role_id INTO v_role_id;
   EXCEPTION WHEN OTHERS THEN
       RAISE EXCEPTION 'Error creating role: %', SQLERRM;
   END;
   
   -- Add permissions to the role with error handling
   BEGIN
       INSERT INTO role_permissions (role_id, permission_id)
       SELECT 
           v_role_id,
           permission_id
       FROM permissions
       WHERE permission_name = ANY(p_permissions);
   EXCEPTION WHEN OTHERS THEN
       RAISE EXCEPTION 'Error adding permissions to role: %', SQLERRM;
   END;
   
   RETURN v_role_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update a user's role
CREATE OR REPLACE FUNCTION update_user_role(
   p_user_id UUID,
   p_role_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
   v_role_id INTEGER;
BEGIN
   -- Get role_id with error handling
   BEGIN
       SELECT role_id INTO v_role_id
       FROM roles
       WHERE role_name = p_role_name;
       
       IF v_role_id IS NULL THEN
           RETURN FALSE;
       END IF;
   EXCEPTION WHEN OTHERS THEN
       RETURN FALSE;
   END;
   
   -- Update user's role with error handling
   BEGIN
       UPDATE staff
       SET role_id = v_role_id
       WHERE user_id = p_user_id;
       
       RETURN FOUND;
   EXCEPTION WHEN OTHERS THEN
       RETURN FALSE;
   END;
END;
$$ LANGUAGE plpgsql;

-- Function to list a user's permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID) 
RETURNS TABLE (
   permission_name TEXT,
   resource_name TEXT,
   can_view BOOLEAN,
   can_create BOOLEAN,
   can_edit BOOLEAN,
   can_delete BOOLEAN
) AS $$
BEGIN
   RETURN QUERY
   SELECT 
       p.permission_name,
       p.resource_name,
       p.can_view,
       p.can_create,
       p.can_edit,
       p.can_delete
   FROM permissions p
   JOIN role_permissions rp ON p.permission_id = rp.permission_id
   JOIN staff s ON rp.role_id = s.role_id
   WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a custom role with specific resource permissions
CREATE OR REPLACE FUNCTION create_custom_role(
   p_role_name TEXT,
   p_description TEXT,
   p_resources TEXT[],
   p_can_view BOOLEAN,
   p_can_create BOOLEAN,
   p_can_edit BOOLEAN,
   p_can_delete BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
   v_role_id INTEGER;
BEGIN
   -- Create the role with error handling
   BEGIN
       INSERT INTO roles (role_name, description)
       VALUES (p_role_name, p_description)
       RETURNING role_id INTO v_role_id;
   EXCEPTION WHEN OTHERS THEN
       RAISE EXCEPTION 'Error creating custom role: %', SQLERRM;
   END;
   
   -- Add permissions to the role based on resources
   BEGIN
       INSERT INTO role_permissions (role_id, permission_id)
       SELECT 
           v_role_id,
           permission_id
       FROM permissions
       WHERE resource_name = ANY(p_resources)
         AND ((p_can_view AND can_view) OR 
              (p_can_create AND can_create) OR 
              (p_can_edit AND can_edit) OR 
              (p_can_delete AND can_delete));
   EXCEPTION WHEN OTHERS THEN
       RAISE EXCEPTION 'Error adding permissions to custom role: %', SQLERRM;
   END;
   
   RETURN v_role_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record version update
CREATE OR REPLACE FUNCTION record_version_update(version TEXT, description TEXT) RETURNS VOID AS $$
BEGIN
   INSERT INTO schema_versions (version, description)
   VALUES (version, description);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 12: Create Dashboard Views
-- =============================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
   (SELECT COUNT(*) FROM staff WHERE is_active = TRUE) as total_staff,
   (SELECT COUNT(*) FROM items) as total_items,
   (SELECT COUNT(*) FROM ingredients WHERE quantity <= minimum_quantity) as low_stock_count,
   (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as active_suppliers,
   (SELECT COALESCE(SUM(total_amount), 0) FROM sales_header 
    WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days') as weekly_sales,
   (SELECT COUNT(*) FROM sales_header 
    WHERE sale_date >= CURRENT_DATE - INTERVAL '24 hours') as sales_today;

-- Staff View with role information
CREATE OR REPLACE VIEW staff_details AS
SELECT 
   s.staff_id,
   s.user_id,
   s.first_name,
   s.last_name,
   s.email,
   s.phone,
   r.role_name,
   s.is_active,
   s.status,
   s.last_login,
   s.created_at
FROM staff s
JOIN roles r ON s.role_id = r.role_id;

-- =============================================
-- STEP 13: Grant Permissions
-- =============================================

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

-- Required for auth.users access
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- =============================================
-- STEP 14: Create Auth Triggers (AT THE END)
-- =============================================

-- Create the auth triggers AFTER all tables and data are set up
CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE TRIGGER on_auth_user_updated
   AFTER UPDATE ON auth.users
   FOR EACH ROW EXECUTE PROCEDURE sync_auth_user();

-- =============================================
-- STEP 15: Record Schema Version
-- =============================================

-- Create database comment with version info
COMMENT ON DATABASE postgres IS 'TrackNToms POS System - Version 2.0.1';

-- Record the version
SELECT record_version_update('2.0.1', 'Fixed schema with proper table creation order and error handling in trigger functions');