-- The customer's saved delivery address moves from 8 users.address_* columns into its own table.
-- Run once on the lcj database, after the v1.5.0 migration (2026-11-23-delivery-address.sql):
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-25-user-addresses-table.sql)
--
-- BACK UP FIRST (database/BACKUP.md): step 3 deletes the old columns and cannot be undone.
--
-- user_addresses = the address a customer saved for next time (Profile, or "Save this address" at checkout).
--                  One row per customer at most (user_id is the primary key); no row = no saved address.
-- orders.delivery_* does not change: each delivery order keeps its own copy of the address.

-- 1. The new table
CREATE TABLE `user_addresses` (
  `user_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `mobile` varchar(11) NOT NULL,
  `street` varchar(255) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `zip` varchar(4) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Copy the addresses customers already saved
INSERT INTO `user_addresses` (`user_id`, `name`, `mobile`, `street`, `barangay`, `city`, `province`, `zip`, `notes`)
SELECT `id`, `address_name`, `address_mobile`, `address_street`, `address_barangay`, `address_city`, `address_province`, `address_zip`, `address_notes`
FROM `users`
WHERE `address_street` IS NOT NULL;

-- 3. Remove the old columns from users
ALTER TABLE `users`
  DROP COLUMN `address_name`,
  DROP COLUMN `address_mobile`,
  DROP COLUMN `address_street`,
  DROP COLUMN `address_barangay`,
  DROP COLUMN `address_city`,
  DROP COLUMN `address_province`,
  DROP COLUMN `address_zip`,
  DROP COLUMN `address_notes`;

-- 4. One cart row per customer and product (database/lcj.sql already has this; older databases may not)
ALTER TABLE `cart` ADD UNIQUE KEY IF NOT EXISTS `unique_user_product` (`user_id`, `product_id`);
