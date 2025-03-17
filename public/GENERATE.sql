-- Insert data into staff table first (as it's referenced by other tables)
INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `email`, `phone_number`, `role`, `password`, `profile_image`) VALUES
(1, 'John', 'Doe', 'john.doe@tomscoffee.com', '555-123-4567', 'Manager', '$2a$12$1JE5X2HU8LxSsGg1W9.VEu1A.5OuIL1DfP3kj4xUBCVz.6jYP6wlO', 'john_profile.jpg'),
(2, 'Jane', 'Smith', 'jane.smith@tomscoffee.com', '555-234-5678', 'Manager', '$2a$12$zUv2Px01QF2VEeP9ZUfPJ.8QUAaNOkUdRtKeBm/koOXI2BD0W3xIS', 'jane_profile.jpg'),
(3, 'Carlos', 'Rodriguez', 'carlos.rodriguez@tomscoffee.com', '555-345-6789', 'Cashier', '$2a$12$M1hyvylHYWcHrX5B5OqoHu3aBP1C6UeWJi0BL.MvUkKmenJlYlvgm', 'carlos_profile.jpg'),
(4, 'Maria', 'Garcia', 'maria.garcia@tomscoffee.com', '555-456-7890', 'Cashier', '$2a$12$P9LbGT0NbUE1AKQO.mOv7OW0UZTV1mYZbUsiA9WA.U65YaOkUfGpK', 'maria_profile.jpg'),
(5, 'Alex', 'Johnson', 'alex.johnson@tomscoffee.com', '555-567-8901', 'Cashier', '$2a$12$s3qwZ8K5C7JwC9L02Tct2O/q9K9vyuXQ1z0O0bKZqNTrBsysD8uJi', 'alex_profile.jpg'),
(6, 'Sarah', 'Williams', 'sarah.williams@tomscoffee.com', '555-678-9012', 'Manager', '$2a$12$ySw.zvUiU0DF.ohnT/c0LeQoOdLm1vJvSdJK7YFBh2TGYTbN.MVTC', 'sarah_profile.jpg'),
(7, 'Michael', 'Brown', 'michael.brown@tomscoffee.com', '555-789-0123', 'Cashier', '$2a$12$1j3GatHK80LRo5bNVTFAyeqZsw2eMpLArnSFgARgnoNBZoAT9eB0a', 'michael_profile.jpg'),
(8, 'Emily', 'Davis', 'emily.davis@tomscoffee.com', '555-890-1234', 'Cashier', '$2a$12$ZeL.C0ZcOGBYXgHLvyQ0veOXjqtWqkdRfMChvULYyeXMJYTL.sOEa', 'emily_profile.jpg');

-- Insert data into managers table
INSERT INTO `managers` (`manager_id`, `staff_id`, `inventory_access`, `sales_access`, `system_admin`, `status`, `date_effectivity`) VALUES
(1, 1, 1, 1, 1, 'Active', '2024-05-01'),
(2, 2, 1, 1, 0, 'Active', '2024-06-15'),
(3, 6, 1, 1, 0, 'Active', '2024-09-01');

-- Insert data into cashiers table
INSERT INTO `cashiers` (`cashier_id`, `staff_id`, `sales_access`, `status`, `date_effectivity`) VALUES
(1, 3, 1, 'Active', '2024-07-01'),
(2, 4, 1, 'Active', '2024-07-15'),
(3, 5, 1, 'Active', '2024-08-01'),
(4, 7, 1, 'Active', '2024-09-15'),
(5, 8, 1, 'Active', '2024-10-01');

-- Insert data into supplier table
INSERT INTO `supplier` (`supplier_id`, `supplier_name`, `contact_person`, `supplier_contact`, `supplier_email`, `address`, `city`, `state`, `postal_code`, `country`, `website`, `payment_terms`, `notes`, `is_active`, `logo`) VALUES
(1, 'Coffee Bean Importers', 'Robert Chen', '555-111-2222', 'robert@coffeebeanimporters.com', '123 Roast Ave', 'Seattle', 'WA', '98101', 'USA', 'www.coffeebeanimporters.com', 'Net 30', 'Premium coffee bean supplier', 1, 'cbi_logo.png'),
(2, 'Sweet Delights Bakery', 'Lisa Wong', '555-222-3333', 'lisa@sweetdelights.com', '456 Sugar St', 'Portland', 'OR', '97201', 'USA', 'www.sweetdelightsbakery.com', 'Net 15', 'Artisanal pastry supplier', 1, 'sdb_logo.png'),
(3, 'Dairy Fresh Co.', 'James Miller', '555-333-4444', 'james@dairyfresh.com', '789 Milk Way', 'San Francisco', 'CA', '94110', 'USA', 'www.dairyfreshco.com', 'Net 7', 'Organic dairy products', 1, 'dfc_logo.png'),
(4, 'Coffee Equipment Pro', 'Samantha Jones', '555-444-5555', 'samantha@coffeeequipmentpro.com', '101 Brewer Blvd', 'Chicago', 'IL', '60601', 'USA', 'www.coffeeequipmentpro.com', 'Net 45', 'Equipment and maintenance', 1, 'cep_logo.png'),
(5, 'Eco Packaging Solutions', 'David Kim', '555-555-6666', 'david@ecopackaging.com', '202 Green St', 'Austin', 'TX', '78701', 'USA', 'www.ecopackagingsolutions.com', 'Net 30', 'Sustainable packaging supplier', 1, 'eps_logo.png');

-- Insert data into ingredients table
INSERT INTO `ingredients` (`ingredient_id`, `name`, `unit`, `quantity`, `minimum_quantity`, `unit_cost`, `last_restock_date`, `image`) VALUES
(1, 'Arabica Coffee Beans', 'kg', 50.00, 10.00, 15.99, '2025-02-15', 'arabica_beans.jpg'),
(2, 'Robusta Coffee Beans', 'kg', 30.00, 8.00, 12.99, '2025-02-15', 'robusta_beans.jpg'),
(3, 'Whole Milk', 'L', 80.00, 20.00, 2.50, '2025-03-01', 'whole_milk.jpg'),
(4, 'Almond Milk', 'L', 25.00, 5.00, 3.75, '2025-03-01', 'almond_milk.jpg'),
(5, 'Oat Milk', 'L', 20.00, 5.00, 3.95, '2025-03-01', 'oat_milk.jpg'),
(6, 'Sugar', 'kg', 35.00, 10.00, 1.50, '2025-02-10', 'sugar.jpg'),
(7, 'Vanilla Syrup', 'L', 8.00, 2.00, 8.99, '2025-02-20', 'vanilla_syrup.jpg'),
(8, 'Caramel Syrup', 'L', 7.50, 2.00, 8.99, '2025-02-20', 'caramel_syrup.jpg'),
(9, 'Chocolate Syrup', 'L', 8.50, 2.00, 9.50, '2025-02-20', 'chocolate_syrup.jpg'),
(10, 'Whipped Cream', 'L', 10.00, 3.00, 4.50, '2025-03-01', 'whipped_cream.jpg'),
(11, 'Flour', 'kg', 25.00, 5.00, 1.25, '2025-02-10', 'flour.jpg'),
(12, 'Butter', 'kg', 15.00, 3.00, 5.99, '2025-03-01', 'butter.jpg'),
(13, 'Eggs', 'dozen', 20.00, 5.00, 3.50, '2025-03-01', 'eggs.jpg'),
(14, 'Baking Powder', 'kg', 3.00, 0.50, 4.25, '2025-01-15', 'baking_powder.jpg'),
(15, 'Cocoa Powder', 'kg', 5.00, 1.00, 9.99, '2025-01-15', 'cocoa_powder.jpg'),
(16, 'Cinnamon', 'kg', 2.00, 0.50, 12.99, '2025-01-15', 'cinnamon.jpg'),
(17, 'Paper Cups (12oz)', 'pcs', 500.00, 100.00, 0.15, '2025-02-25', 'paper_cups.jpg'),
(18, 'Paper Cups (16oz)', 'pcs', 500.00, 100.00, 0.18, '2025-02-25', 'paper_cups_large.jpg'),
(19, 'Napkins', 'pcs', 1000.00, 200.00, 0.03, '2025-02-25', 'napkins.jpg'),
(20, 'Stirrers', 'pcs', 800.00, 150.00, 0.02, '2025-02-25', 'stirrers.jpg');

-- Insert data into items table
INSERT INTO `items` (`item_id`, `item_name`, `category`, `base_price`, `description`, `image`, `is_externally_sourced`) VALUES
(1, 'Espresso', 'Coffee', 3.50, 'Strong, concentrated coffee served in a small cup', 'espresso.jpg', 0),
(2, 'Americano', 'Coffee', 4.00, 'Espresso diluted with hot water', 'americano.jpg', 0),
(3, 'Cappuccino', 'Coffee', 4.50, 'Espresso with steamed milk and foam', 'cappuccino.jpg', 0),
(4, 'Latte', 'Coffee', 4.75, 'Espresso with steamed milk', 'latte.jpg', 0),
(5, 'Mocha', 'Coffee', 5.25, 'Espresso with chocolate and steamed milk', 'mocha.jpg', 0),
(6, 'Caramel Macchiato', 'Coffee', 5.50, 'Vanilla-flavored espresso with caramel and steamed milk', 'caramel_macchiato.jpg', 0),
(7, 'Chocolate Croissant', 'Pastries', 3.95, 'Buttery croissant with chocolate filling', 'chocolate_croissant.jpg', 0),
(8, 'Blueberry Muffin', 'Pastries', 3.75, 'Moist muffin with blueberries', 'blueberry_muffin.jpg', 0),
(9, 'Cinnamon Roll', 'Pastries', 4.25, 'Sweet roll with cinnamon and icing', 'cinnamon_roll.jpg', 0),
(10, 'Ham & Cheese Sandwich', 'Food', 6.50, 'Fresh sandwich with ham, cheese, and greens', 'ham_cheese_sandwich.jpg', 0),
(11, 'Chicken Salad Wrap', 'Food', 7.50, 'Grilled chicken with mixed greens in a wrap', 'chicken_salad_wrap.jpg', 0),
(12, 'Iced Coffee', 'Drinks', 4.25, 'Chilled coffee served over ice', 'iced_coffee.jpg', 0),
(13, 'Iced Tea', 'Drinks', 3.75, 'Freshly brewed tea served over ice', 'iced_tea.jpg', 0),
(14, 'Bottled Water', 'Drinks', 2.50, 'Pure spring water in a recyclable bottle', 'bottled_water.jpg', 1),
(15, 'Ceramic Mug', 'Utensils', 12.99, 'High-quality ceramic mug with shop logo', 'ceramic_mug.jpg', 1),
(16, 'Reusable Straw', 'Utensils', 3.99, 'Eco-friendly metal straw', 'reusable_straw.jpg', 1),
(17, 'Extra Shot', 'Add Ons', 1.00, 'Additional shot of espresso', 'extra_shot.jpg', 0),
(18, 'Alternative Milk', 'Add Ons', 0.75, 'Substitute with almond, oat, or soy milk', 'alt_milk.jpg', 0),
(19, 'Flavor Syrup', 'Add Ons', 0.75, 'Add vanilla, caramel, or hazelnut flavor', 'flavor_syrup.jpg', 0),
(20, 'Whipped Cream', 'Add Ons', 0.50, 'Add whipped cream topping', 'whipped_cream_addon.jpg', 0);

-- Insert data into item_ingredients table
INSERT INTO `item_ingredients` (`item_id`, `ingredient_id`, `quantity`) VALUES
(1, 1, 0.02), -- Espresso - Arabica Coffee Beans
(2, 1, 0.02), -- Americano - Arabica Coffee Beans
(3, 1, 0.02), -- Cappuccino - Arabica Coffee Beans
(3, 3, 0.15), -- Cappuccino - Whole Milk
(4, 1, 0.02), -- Latte - Arabica Coffee Beans
(4, 3, 0.25), -- Latte - Whole Milk
(5, 1, 0.02), -- Mocha - Arabica Coffee Beans
(5, 3, 0.20), -- Mocha - Whole Milk
(5, 9, 0.03), -- Mocha - Chocolate Syrup
(6, 1, 0.02), -- Caramel Macchiato - Arabica Coffee Beans
(6, 3, 0.20), -- Caramel Macchiato - Whole Milk
(6, 7, 0.02), -- Caramel Macchiato - Vanilla Syrup
(6, 8, 0.02), -- Caramel Macchiato - Caramel Syrup
(7, 11, 0.10), -- Chocolate Croissant - Flour
(7, 12, 0.05), -- Chocolate Croissant - Butter
(7, 15, 0.02), -- Chocolate Croissant - Cocoa Powder
(8, 11, 0.12), -- Blueberry Muffin - Flour
(8, 12, 0.04), -- Blueberry Muffin - Butter
(8, 13, 0.17), -- Blueberry Muffin - Eggs
(8, 14, 0.01), -- Blueberry Muffin - Baking Powder
(9, 11, 0.15), -- Cinnamon Roll - Flour
(9, 12, 0.06), -- Cinnamon Roll - Butter
(9, 6, 0.05), -- Cinnamon Roll - Sugar
(9, 16, 0.01), -- Cinnamon Roll - Cinnamon
(12, 2, 0.03), -- Iced Coffee - Robusta Coffee Beans
(17, 1, 0.02), -- Extra Shot - Arabica Coffee Beans
(18, 4, 0.25), -- Alternative Milk - Almond Milk (example)
(19, 7, 0.02), -- Flavor Syrup - Vanilla Syrup (example)
(20, 10, 0.03); -- Whipped Cream - Whipped Cream

-- Insert data into consignment table
INSERT INTO `consignment` (`consignment_id`, `supplier_id`, `date`, `invoice_number`, `reference_number`, `manager_id`, `total`) VALUES
(1, 2, '2025-02-10', 'INV-SDB-2025-0210', 'REF-2025-001', 1, 785.50),
(2, 1, '2025-02-15', 'INV-CBI-2025-0215', 'REF-2025-002', 2, 1250.75),
(3, 3, '2025-03-01', 'INV-DFC-2025-0301', 'REF-2025-003', 1, 620.25),
(4, 5, '2025-02-25', 'INV-EPS-2025-0225', 'REF-2025-004', 3, 340.80),
(5, 4, '2025-02-20', 'INV-CEP-2025-0220', 'REF-2025-005', 2, 895.60);

-- Insert data into consignment_details table
INSERT INTO `consignment_details` (`consignment_id`, `item_id`, `quantity`, `supplier_price`, `production_date`, `usa_total`) VALUES
(1, 7, 50, 2.50, '2025-02-09', 125.00), -- Chocolate Croissant
(1, 8, 60, 2.25, '2025-02-09', 135.00), -- Blueberry Muffin
(1, 9, 45, 2.75, '2025-02-09', 123.75), -- Cinnamon Roll
(2, 14, 100, 1.50, '2025-02-05', 150.00), -- Bottled Water
(2, 15, 24, 8.50, '2025-01-20', 204.00), -- Ceramic Mug
(3, 16, 100, 2.50, '2025-01-15', 250.00), -- Reusable Straw
(4, 17, 10, 12.00, '2025-02-10', 120.00), -- Package of Extra Shot supplies
(4, 18, 10, 15.00, '2025-02-10', 150.00), -- Package of Alternative Milk supplies
(5, 19, 10, 14.50, '2025-02-15', 145.00), -- Package of Flavor Syrup supplies
(5, 20, 10, 10.00, '2025-02-15', 100.00); -- Package of Whipped Cream supplies

-- Insert data into sales_header table
INSERT INTO `sales_header` (`sale_id`, `cashier_id`, `sale_date`, `manager_id`, `total_amount`, `payment_method`) VALUES
(1, 1, '2025-03-10 08:15:23', NULL, 8.50, 'Credit Card'),
(2, 2, '2025-03-10 08:45:12', NULL, 12.70, 'Cash'),
(3, 3, '2025-03-10 09:30:45', NULL, 15.25, 'Credit Card'),
(4, 4, '2025-03-10 10:20:18', NULL, 9.75, 'Mobile Payment'),
(5, 5, '2025-03-10 11:05:37', NULL, 21.45, 'Credit Card'),
(6, 1, '2025-03-10 12:15:50', NULL, 14.00, 'Cash'),
(7, 2, '2025-03-10 13:25:33', NULL, 11.50, 'Mobile Payment'),
(8, 3, '2025-03-10 14:10:22', NULL, 18.30, 'Credit Card'),
(9, 4, '2025-03-10 15:40:05', NULL, 7.25, 'Cash'),
(10, 5, '2025-03-10 16:55:47', NULL, 16.75, 'Credit Card');
MariaDB [trackntoms]> select sh.sale_date ,total_amount from sales_header sh;

                      select s.first_name from managers m left join staff s on m.staff_id = s.staff_id;

-- Insert data into sales_detail table
INSERT INTO `sales_detail` (`sale_detail_id`, `sale_id`, `item_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 1, 1, 3.50, 3.50), -- Espresso
(2, 1, 8, 1, 3.75, 3.75), -- Blueberry Muffin
(3, 1, 17, 1, 1.00, 1.00), -- Extra Shot add-on
(4, 1, 19, 1, 0.75, 0.75), -- Flavor Syrup add-on
(5, 2, 4, 2, 4.75, 9.50), -- 2 Lattes
(6, 2, 19, 2, 0.75, 1.50), -- 2 Flavor Syrup add-ons
(7, 2, 18, 1, 0.75, 0.75), -- 1 Alternative Milk add-on
(8, 3, 6, 1, 5.50, 5.50), -- Caramel Macchiato
(9, 3, 9, 1, 4.25, 4.25), -- Cinnamon Roll
(10, 3, 14, 2, 2.50, 5.00), -- 2 Bottled Waters
(11, 4, 3, 1, 4.50, 4.50), -- Cappuccino
(12, 4, 7, 1, 3.95, 3.95), -- Chocolate Croissant
(13, 4, 17, 1, 1.00, 1.00), -- Extra Shot add-on
(14, 5, 11, 1, 7.50, 7.50), -- Chicken Salad Wrap
(15, 5, 5, 2, 5.25, 10.50), -- 2 Mochas
(16, 5, 20, 2, 0.50, 1.00), -- 2 Whipped Cream add-ons
(17, 5, 18, 2, 0.75, 1.50), -- 2 Alternative Milk add-ons
(18, 6, 10, 1, 6.50, 6.50), -- Ham & Cheese Sandwich
(19, 6, 12, 1, 4.25, 4.25), -- Iced Coffee
(20, 6, 14, 1, 2.50, 2.50), -- Bottled Water
(21, 7, 2, 2, 4.00, 8.00), -- 2 Americanos
(22, 7, 8, 1, 3.75, 3.75), -- Blueberry Muffin
(23, 8, 5, 1, 5.25, 5.25), -- Mocha
(24, 8, 11, 1, 7.50, 7.50), -- Chicken Salad Wrap
(25, 8, 13, 1, 3.75, 3.75), -- Iced Tea
(26, 8, 19, 1, 0.75, 0.75), -- Flavor Syrup add-on
(27, 8, 20, 1, 0.50, 0.50), -- Whipped Cream add-on
(28, 9, 1, 1, 3.50, 3.50), -- Espresso
(29, 9, 17, 1, 1.00, 1.00), -- Extra Shot add-on
(30, 9, 9, 1, 4.25, 4.25), -- Cinnamon Roll
(31, 10, 4, 2, 4.75, 9.50), -- 2 Lattes
(32, 10, 7, 1, 3.95, 3.95), -- Chocolate Croissant
(33, 10, 18, 2, 0.75, 1.50), -- 2 Alternative Milk add-ons
(34, 10, 19, 2, 0.75, 1.50); -- 2 Flavor Syrup add-ons

-- Insert data into purchase table
INSERT INTO `purchase` (`purchase_id`, `staff_id`, `manager_id`, `purchase_date`, `total_amount`) VALUES
(1, 1, NULL, '2025-02-10 10:30:00', 325.50),
(2, 2, NULL, '2025-02-15 11:15:00', 850.25),
(3, 6, NULL, '2025-02-20 09:45:00', 410.75),
(4, 1, NULL, '2025-02-25 14:20:00', 275.80),
(5, 2, NULL, '2025-03-01 08:50:00', 575.20);

-- Insert data into purchase_details table
INSERT INTO `purchase_details` (`purchase_id`, `ingredient_id`, `quantity`, `unit_price`, `subtotal`, `product_expiration_date`) VALUES
(1, 11, 25, 1.25, 31.25, '2025-08-10'), -- Flour
(1, 12, 15, 5.99, 89.85, '2025-06-10'), -- Butter
(1, 13, 20, 3.50, 70.00, '2025-04-10'), -- Eggs
(1, 14, 3, 4.25, 12.75, '2025-07-10'), -- Baking Powder
(1, 15, 5, 9.99, 49.95, '2025-08-10'), -- Cocoa Powder
(1, 16, 2, 12.99, 25.98, '2025-08-10'), -- Cinnamon
(2, 1, 50, 15.99, 799.50, '2025-08-15'), -- Arabica Coffee Beans
(2, 2, 30, 12.99, 389.70, '2025-08-15'), -- Robusta Coffee Beans
(3, 7, 8, 8.99, 71.92, '2025-08-20'), -- Vanilla Syrup
(3, 8, 7.5, 8.99, 67.43, '2025-08-20'), -- Caramel Syrup
(3, 9, 8.5, 9.50, 80.75, '2025-08-20'), -- Chocolate Syrup
(4, 17, 500, 0.15, 75.00, '2026-02-25'), -- Paper Cups (12oz)
(4, 18, 500, 0.18, 90.00, '2026-02-25'), -- Paper Cups (16oz)
(4, 19, 1000, 0.03, 30.00, '2026-02-25'), -- Napkins
(4, 20, 800, 0.02, 16.00, '2026-02-25'), -- Stirrers
(5, 3, 80, 2.50, 200.00, '2025-04-01'), -- Whole Milk
(5, 4, 25, 3.75, 93.75, '2025-04-01'), -- Almond Milk
(5, 5, 20, 3.95, 79.00, '2025-04-01'), -- Oat Milk
(5, 10, 10, 4.50, 45.00, '2025-04-15'); -- Whipped Cream

-- Insert data into pullout table
INSERT INTO `pullout` (`pullout_id`, `ingredient_id`, `staff_id`, `manager_id`, `quantity`, `reason`, `date_of_pullout`) VALUES
(1, 3, 3, 1, 5.00, 'Expired product', '2025-03-05'),
(2, 13, 4, 2, 2.00, 'Damaged packaging', '2025-03-07'),
(3, 10, 5, 3, 1.50, 'Quality issues', '2025-03-08'),
(4, 7, 7, 1, 0.75, 'Leaking container', '2025-03-09'),
(5, 17, 8, 2, 25.00, 'Defective batch', '2025-03-10');