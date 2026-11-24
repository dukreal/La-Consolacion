-- Store pickup or delivery by courier (LBC or another courier), with the delivery address.
-- Run once on the lcj database, before using the new checkout:
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-23-delivery-address.sql)
--
-- orders.fulfillment   = 'pickup' (every order so far, and walk-in sales) or 'delivery'
-- orders.delivery_*    = where a delivery order goes, copied at checkout (a later profile change does not move it)
-- users.address_*      = the address the customer saved for next time (Profile, or "Save this address" at checkout)
ALTER TABLE `orders`
  ADD COLUMN `fulfillment` varchar(10) NOT NULL DEFAULT 'pickup' AFTER `status`,
  ADD COLUMN `delivery_name` varchar(150) DEFAULT NULL AFTER `fulfillment`,
  ADD COLUMN `delivery_mobile` varchar(11) DEFAULT NULL AFTER `delivery_name`,
  ADD COLUMN `delivery_street` varchar(255) DEFAULT NULL AFTER `delivery_mobile`,
  ADD COLUMN `delivery_barangay` varchar(100) DEFAULT NULL AFTER `delivery_street`,
  ADD COLUMN `delivery_city` varchar(100) DEFAULT NULL AFTER `delivery_barangay`,
  ADD COLUMN `delivery_province` varchar(100) DEFAULT NULL AFTER `delivery_city`,
  ADD COLUMN `delivery_zip` varchar(4) DEFAULT NULL AFTER `delivery_province`,
  ADD COLUMN `delivery_notes` varchar(255) DEFAULT NULL AFTER `delivery_zip`;

ALTER TABLE `users`
  ADD COLUMN `address_name` varchar(150) DEFAULT NULL AFTER `profile_image`,
  ADD COLUMN `address_mobile` varchar(11) DEFAULT NULL AFTER `address_name`,
  ADD COLUMN `address_street` varchar(255) DEFAULT NULL AFTER `address_mobile`,
  ADD COLUMN `address_barangay` varchar(100) DEFAULT NULL AFTER `address_street`,
  ADD COLUMN `address_city` varchar(100) DEFAULT NULL AFTER `address_barangay`,
  ADD COLUMN `address_province` varchar(100) DEFAULT NULL AFTER `address_city`,
  ADD COLUMN `address_zip` varchar(4) DEFAULT NULL AFTER `address_province`,
  ADD COLUMN `address_notes` varchar(255) DEFAULT NULL AFTER `address_zip`;
