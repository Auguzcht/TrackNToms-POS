-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 04, 2025 at 04:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `toms2`
--

-- --------------------------------------------------------

--
-- Table structure for table `cashiers`
--

CREATE TABLE `cashiers` (
  `cashier_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `sales_access` tinyint(1) DEFAULT 1,
  `status` enum('Active','Inactive') NOT NULL,
  `date_effectivity` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consignment`
--

CREATE TABLE `consignment` (
  `consignment_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `invoice_number` VARCHAR(50),
  `reference_number` VARCHAR(50),
  `manager_id` int(11) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consignment_details`
--

CREATE TABLE `consignment_details` (
  `consignment_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `supplier_price` decimal(7,2) NOT NULL,
  `production_date` date DEFAULT NULL,
  `usa_total` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `ingredient_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `quantity` decimal(7,2) NOT NULL,
  `minimum_quantity` decimal(7,2) NOT NULL,
  `unit_cost` decimal(7,2) NOT NULL,
  `last_restock_date` date DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `category` enum('Coffee','Pastries','Food','Utensils','Add Ons','Drinks') NOT NULL,
  `base_price` decimal(7,2) NOT NULL,
  `description` text DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_externally_sourced` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_ingredients`
--

CREATE TABLE `item_ingredients` (
  `item_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` decimal(6,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `managers`
--

CREATE TABLE `managers` (
  `manager_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `inventory_access` tinyint(1) DEFAULT 1,
  `sales_access` tinyint(1) DEFAULT 1,
  `system_admin` tinyint(1) DEFAULT 0,
  `status` enum('Active','Inactive') NOT NULL,
  `date_effectivity` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pullout`
--

CREATE TABLE `pullout` (
  `pullout_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `manager_id` int(11) NOT NULL,
  `quantity` decimal(7,2) NOT NULL,
  `reason` text NOT NULL,
  `date_of_pullout` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase`
--

CREATE TABLE `purchase` (
  `purchase_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `purchase_date` datetime NOT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_details`
--

CREATE TABLE `purchase_details` (
  `purchase_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(7,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `product_expiration_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_detail`
--

CREATE TABLE `sales_detail` (
  `sale_detail_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(7,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_header`
--

CREATE TABLE `sales_header` (
  `sale_id` int(11) NOT NULL,
  `cashier_id` int(11) NOT NULL,
  `sale_date` datetime NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('Cashier','Manager') NOT NULL,
  `password` varchar(300) NOT NULL,
  `profile_image` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(100) NOT NULL,
  `contact_person` VARCHAR(100) DEFAULT NULL,
  `supplier_contact` varchar(50) DEFAULT NULL,
  `supplier_email` varchar(100) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `payment_terms` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `logo` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cashiers`
--
ALTER TABLE `cashiers`
  ADD PRIMARY KEY (`cashier_id`),
  ADD UNIQUE KEY `staff_id` (`staff_id`);

--
-- Indexes for table `consignment`
--
ALTER TABLE `consignment`
  ADD PRIMARY KEY (`consignment_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indexes for table `consignment_details`
--
ALTER TABLE `consignment_details`
  ADD PRIMARY KEY (`consignment_id`,`item_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`ingredient_id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `item_ingredients`
--
ALTER TABLE `item_ingredients`
  ADD PRIMARY KEY (`item_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `managers`
--
ALTER TABLE `managers`
  ADD PRIMARY KEY (`manager_id`),
  ADD UNIQUE KEY `staff_id` (`staff_id`);

--
-- Indexes for table `pullout`
--
ALTER TABLE `pullout`
  ADD PRIMARY KEY (`pullout_id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indexes for table `purchase`
--
ALTER TABLE `purchase`
  ADD PRIMARY KEY (`purchase_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indexes for table `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD PRIMARY KEY (`purchase_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `sales_detail`
--
ALTER TABLE `sales_detail`
  ADD PRIMARY KEY (`sale_detail_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `sales_header`
--
ALTER TABLE `sales_header`
  ADD PRIMARY KEY (`sale_id`),
  ADD KEY `cashier_id` (`cashier_id`),
  ADD KEY `manager_id` (`manager_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `password` (`password`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`supplier_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cashiers`
--
ALTER TABLE `cashiers`
  MODIFY `cashier_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consignment`
--
ALTER TABLE `consignment`
  MODIFY `consignment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `ingredient_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `managers`
--
ALTER TABLE `managers`
  MODIFY `manager_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pullout`
--
ALTER TABLE `pullout`
  MODIFY `pullout_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase`
--
ALTER TABLE `purchase`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_detail`
--
ALTER TABLE `sales_detail`
  MODIFY `sale_detail_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_header`
--
ALTER TABLE `sales_header`
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cashiers`
--
ALTER TABLE `cashiers`
  ADD CONSTRAINT `cashiers_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `consignment`
--
ALTER TABLE `consignment`
  ADD CONSTRAINT `consignment_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  ADD CONSTRAINT `consignment_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `managers` (`manager_id`);

--
-- Constraints for table `consignment_details`
--
ALTER TABLE `consignment_details`
  ADD CONSTRAINT `consignment_details_ibfk_1` FOREIGN KEY (`consignment_id`) REFERENCES `consignment` (`consignment_id`),
  ADD CONSTRAINT `consignment_details_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

--
-- Constraints for table `item_ingredients`
--
ALTER TABLE `item_ingredients`
  ADD CONSTRAINT `item_ingredients_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  ADD CONSTRAINT `item_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`);

--
-- Constraints for table `managers`
--
ALTER TABLE `managers`
  ADD CONSTRAINT `managers_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `pullout`
--
ALTER TABLE `pullout`
  ADD CONSTRAINT `pullout_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  ADD CONSTRAINT `pullout_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `pullout_ibfk_3` FOREIGN KEY (`manager_id`) REFERENCES `managers` (`manager_id`);

--
-- Constraints for table `purchase`
--
ALTER TABLE `purchase`
  ADD CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `managers` (`manager_id`);

--
-- Constraints for table `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD CONSTRAINT `purchase_details_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`purchase_id`),
  ADD CONSTRAINT `purchase_details_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`);

--
-- Constraints for table `sales_detail`
--
ALTER TABLE `sales_detail`
  ADD CONSTRAINT `sales_detail_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales_header` (`sale_id`),
  ADD CONSTRAINT `sales_detail_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

--
-- Constraints for table `sales_header`
--
ALTER TABLE `sales_header`
  ADD CONSTRAINT `sales_header_ibfk_1` FOREIGN KEY (`cashier_id`) REFERENCES `staff` (`staff_id`),
  ADD CONSTRAINT `sales_header_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `staff` (`staff_id`);



COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;