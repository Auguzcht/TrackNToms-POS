-- Tom N Toms Coffee Menu Database Population Scripts

-- 1. Insert Categories
INSERT INTO categories (category_name, description, sort_order, is_active) VALUES
('SOMETHING NEW: DRINKS', 'Latest featured beverage offerings', 1, true),
('ESPRESSO BEVERAGE', 'Core coffee menu with espresso base', 2, true),
('TEA', 'Traditional and specialty tea selections', 3, true),
('BEVERAGE', 'Non-coffee hot beverages', 4, true),
('ICED BEVERAGE', 'Cold refreshing drinks', 5, true),
('COFFEE TOMNCCINO', 'Signature blended coffee drinks', 6, true),
('NON TOMNCCINO', 'Blended non-coffee beverages', 7, true),
('SMOOTHIE', 'Fresh fruit smoothies', 8, true),
('SOMETHING NEW: FOOD', 'Latest food offerings', 9, true),
('PRETZEL', 'German-style baked pretzels', 10, true),
('BREADS & PASTRY', 'Fresh baked goods and pastries', 11, true),
('BRUNCH PLATES', 'Complete meal options', 12, true),
('PASTA', 'Italian-inspired pasta dishes', 13, true),
('SANDWICHES', 'Made-to-order sandwiches', 14, true);

-- 2. Insert Core Ingredients
INSERT INTO ingredients (ingredient_name, category, unit, cost_per_unit, minimum_quantity, expiration_days, is_active) VALUES
('Espresso', 'Coffee', 'shots', 25.00, 50, 1, true),
('Milk', 'Dairy', 'ml', 2.50, 2000, 3, true),
('Water', 'Basic', 'ml', 0.50, 5000, 365, true),
('Milk Foam', 'Dairy', 'ml', 3.00, 500, 1, true),
('Chocolate Sauce', 'Syrups', 'ml', 4.00, 500, 30, true),
('Vanilla Syrup', 'Syrups', 'ml', 3.50, 500, 60, true),
('Caramel Syrup', 'Syrups', 'ml', 3.50, 500, 60, true),
('Whipped Cream', 'Dairy', 'ml', 5.00, 300, 7, true),
('Taro Powder', 'Specialty', 'grams', 8.00, 200, 180, true),
('Shine Muscat', 'Fruits', 'grams', 15.00, 100, 5, true),
('Tea Leaves', 'Tea', 'grams', 4.00, 300, 365, true),
('Matcha Powder', 'Specialty', 'grams', 12.00, 100, 180, true),
('Ice', 'Basic', 'grams', 0.20, 5000, 1, true),
('Sugar', 'Basic', 'grams', 1.00, 1000, 365, true),
('Cinnamon', 'Spices', 'grams', 6.00, 50, 365, true);

-- 3. Insert Sample Menu Items (Core Espresso Beverages)
INSERT INTO items (item_code, item_name, category_id, description, base_price, size, preparation_time, is_active, is_featured) VALUES
-- Café Americano variations
('AMER_T', 'Café Americano (Tall)', 2, 'Espresso shots with water', 165.00, 'Tall', 3, true, false),
('AMER_G', 'Café Americano (Grande)', 2, 'Espresso shots with water', 180.00, 'Grande', 3, true, true),
('AMER_V', 'Café Americano (Venti)', 2, 'Espresso shots with water', 195.00, 'Venti', 4, true, false),

-- Café Latte variations
('LATTE_T', 'Café Latte (Tall)', 2, 'Espresso shots with steamed milk and milk foam', 175.00, 'Tall', 4, true, false),
('LATTE_G', 'Café Latte (Grande)', 2, 'Espresso shots with steamed milk and milk foam', 190.00, 'Grande', 4, true, true),
('LATTE_V', 'Café Latte (Venti)', 2, 'Espresso shots with steamed milk and milk foam', 205.00, 'Venti', 5, true, false),

-- Cappuccino variations
('CAPP_T', 'Cappuccino (Tall)', 2, 'Espresso shots with steamed milk and thick milk foam', 175.00, 'Tall', 4, true, false),
('CAPP_G', 'Cappuccino (Grande)', 2, 'Espresso shots with steamed milk and thick milk foam', 190.00, 'Grande', 4, true, false),
('CAPP_V', 'Cappuccino (Venti)', 2, 'Espresso shots with steamed milk and thick milk foam', 205.00, 'Venti', 5, true, false),

-- Café Mocha variations
('MOCHA_T', 'Café Mocha (Tall)', 2, 'Espresso shots, chocolate sauce and steamed milk with milk foam', 190.00, 'Tall', 5, true, true),
('MOCHA_G', 'Café Mocha (Grande)', 2, 'Espresso shots, chocolate sauce and steamed milk with milk foam', 205.00, 'Grande', 5, true, true),
('MOCHA_V', 'Café Mocha (Venti)', 2, 'Espresso shots, chocolate sauce and steamed milk with milk foam', 220.00, 'Venti', 6, true, false),

-- Signature New Drinks
('TARO_G', 'Sweet Taro', 1, 'Comforting sweet creamy beverage from taro root with vanilla and coconut notes', 215.00, 'Grande', 4, true, true),
('MUSCAT_ADE', 'Shine Muscat Ade', 1, 'Refreshing beverage made with premium Shine Muscat grapes', 205.00, 'Regular', 3, true, true),
('MUSCAT_SLUSH', 'Shine Muscat Slush', 1, 'Natural grape sweetness in luxurious slushy texture', 215.00, 'Regular', 4, true, true);

-- 4. Insert Recipe Relationships (item_ingredients)
-- Café Americano recipes
INSERT INTO item_ingredients (item_id, ingredient_id, quantity, unit) VALUES
-- Americano Tall
(1, 1, 1, 'shots'), -- Espresso
(1, 3, 150, 'ml'),   -- Water

-- Americano Grande  
(2, 1, 2, 'shots'), -- Espresso
(2, 3, 200, 'ml'),   -- Water

-- Americano Venti
(3, 1, 2, 'shots'), -- Espresso
(3, 3, 250, 'ml'),   -- Water

-- Café Latte recipes
-- Latte Tall
(4, 1, 1, 'shots'), -- Espresso
(4, 2, 120, 'ml'),   -- Milk
(4, 4, 10, 'ml'),    -- Milk Foam

-- Latte Grande
(5, 1, 2, 'shots'), -- Espresso
(5, 2, 180, 'ml'),   -- Milk
(5, 4, 15, 'ml'),    -- Milk Foam

-- Latte Venti
(6, 1, 2, 'shots'), -- Espresso
(6, 2, 240, 'ml'),   -- Milk
(6, 4, 20, 'ml'),    -- Milk Foam

-- Cappuccino recipes
-- Cappuccino Tall
(7, 1, 1, 'shots'), -- Espresso
(7, 2, 80, 'ml'),    -- Milk
(7, 4, 40, 'ml'),    -- Milk Foam

-- Cappuccino Grande
(8, 1, 2, 'shots'), -- Espresso
(8, 2, 120, 'ml'),   -- Milk
(8, 4, 60, 'ml'),    -- Milk Foam

-- Cappuccino Venti
(9, 1, 2, 'shots'), -- Espresso
(9, 2, 160, 'ml'),   -- Milk
(9, 4, 80, 'ml'),    -- Milk Foam

-- Café Mocha recipes
-- Mocha Tall
(10, 1, 1, 'shots'), -- Espresso
(10, 2, 100, 'ml'),  -- Milk
(10, 4, 15, 'ml'),   -- Milk Foam
(10, 5, 15, 'ml'),   -- Chocolate Sauce

-- Mocha Grande
(11, 1, 2, 'shots'), -- Espresso
(11, 2, 150, 'ml'),  -- Milk
(11, 4, 20, 'ml'),   -- Milk Foam
(11, 5, 20, 'ml'),   -- Chocolate Sauce

-- Mocha Venti
(12, 1, 2, 'shots'), -- Espresso
(12, 2, 200, 'ml'),  -- Milk
(12, 4, 25, 'ml'),   -- Milk Foam
(12, 5, 25, 'ml'),   -- Chocolate Sauce

-- Sweet Taro recipe
(13, 9, 20, 'grams'), -- Taro Powder
(13, 2, 200, 'ml'),   -- Milk
(13, 6, 15, 'ml'),    -- Vanilla Syrup
(13, 8, 20, 'ml'),    -- Whipped Cream

-- Shine Muscat Ade recipe
(14, 10, 50, 'grams'), -- Shine Muscat
(14, 3, 250, 'ml'),    -- Water
(14, 13, 100, 'grams'), -- Ice
(14, 14, 10, 'grams'),  -- Sugar

-- Shine Muscat Slush recipe
(15, 10, 60, 'grams'), -- Shine Muscat
(15, 3, 200, 'ml'),    -- Water
(15, 13, 150, 'grams'), -- Ice
(15, 14, 15, 'grams');  -- Sugar

-- 5. Create Price History Table for Analytics
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(item_id),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    change_reason TEXT,
    effective_date TIMESTAMP DEFAULT NOW(),
    created_by INTEGER
);

-- 6. Create Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id SERIAL PRIMARY KEY,
    ingredient_id INTEGER REFERENCES ingredients(ingredient_id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT')),
    quantity DECIMAL(10,3),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    supplier_id INTEGER,
    notes TEXT,
    transaction_date TIMESTAMP DEFAULT NOW(),
    created_by INTEGER
);

-- 7. Create Recipe Cost Calculation View
CREATE OR REPLACE VIEW recipe_costs AS
SELECT 
    i.item_id,
    i.item_name,
    i.base_price,
    SUM(ii.quantity * ing.cost_per_unit / 
        CASE ing.unit 
            WHEN 'ml' THEN 1000 
            WHEN 'grams' THEN 1000 
            ELSE 1 
        END) as ingredient_cost,
    i.base_price - SUM(ii.quantity * ing.cost_per_unit / 
        CASE ing.unit 
            WHEN 'ml' THEN 1000 
            WHEN 'grams' THEN 1000 
            ELSE 1 
        END) as profit,
    ROUND(((i.base_price - SUM(ii.quantity * ing.cost_per_unit / 
        CASE ing.unit 
            WHEN 'ml' THEN 1000 
            WHEN 'grams' THEN 1000 
            ELSE 1 
        END)) / i.base_price * 100), 2) as profit_margin_percent
FROM items i
JOIN item_ingredients ii ON i.item_id = ii.item_id
JOIN ingredients ing ON ii.ingredient_id = ing.ingredient_id
WHERE i.is_active = true
GROUP BY i.item_id, i.item_name, i.base_price
ORDER BY profit_margin_percent DESC;

-- 8. Sample Queries for Analysis

-- View all menu items with ingredients
/*
SELECT 
    i.item_name,
    c.category_name,
    i.base_price,
    string_agg(ing.ingredient_name || ' (' || ii.quantity || ' ' || ii.unit || ')', ', ') as ingredients
FROM items i
JOIN categories c ON i.category_id = c.category_id
LEFT JOIN item_ingredients ii ON i.item_id = ii.item_id
LEFT JOIN ingredients ing ON ii.ingredient_id = ing.ingredient_id
WHERE i.is_active = true
GROUP BY i.item_id, i.item_name, c.category_name, i.base_price
ORDER BY c.sort_order, i.base_price;
*/

-- View recipe costs and profit margins
/*
SELECT * FROM recipe_costs 
ORDER BY profit_margin_percent DESC;
*/

-- Inventory status check
/*
SELECT 
    ingredient_name,
    current_quantity,
    minimum_quantity,
    unit,
    CASE 
        WHEN current_quantity <= minimum_quantity THEN 'REORDER NEEDED'
        WHEN current_quantity <= minimum_quantity * 1.5 THEN 'LOW STOCK'
        ELSE 'ADEQUATE'
    END as stock_status
FROM ingredients
WHERE is_active = true
ORDER BY 
    CASE 
        WHEN current_quantity <= minimum_quantity THEN 1
        WHEN current_quantity <= minimum_quantity * 1.5 THEN 2
        ELSE 3
    END,
    ingredient_name;
*/