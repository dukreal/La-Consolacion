-- Delivery Part 2: shipping fee, online payment of the rest, courier and tracking number.
-- Run once on the lcj database, after 2026-11-25-user-addresses-table.sql:
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-25-delivery-tracking.sql)
-- Back up first (database/BACKUP.md).
--
-- orders.shipping_fee      = what the courier charges, set by the admin when a delivery order is Ready
--                            (Waiting for Buyer); added to the order's total. NULL = not set (every pickup order).
-- orders.courier           = 'LBC', 'J&T Express' or the name the admin typed for another courier
-- orders.tracking_number   = the courier's tracking number, filled in when the order ships (Completed)
-- orders.balance_to_check  = 1 while the customer has paid the rest online (orders.balance_payment_id) and the
--                            admin has not checked the screenshot yet; that payment does not count as paid until then.
--                            Balance payments recorded by the admin (all the ones so far) are 0.
ALTER TABLE `orders`
  ADD COLUMN `shipping_fee` decimal(10,2) DEFAULT NULL AFTER `delivery_notes`,
  ADD COLUMN `courier` varchar(50) DEFAULT NULL AFTER `shipping_fee`,
  ADD COLUMN `tracking_number` varchar(100) DEFAULT NULL AFTER `courier`,
  ADD COLUMN `balance_to_check` tinyint(1) NOT NULL DEFAULT 0 AFTER `balance_payment_id`;
