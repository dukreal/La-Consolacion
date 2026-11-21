-- Records the balance a customer pays at pickup (the 70% left after the 30% downpayment).
-- Run once on the lcj database, before using the new Confirm Order step:
--   mysql -u <user> -p lcj < database/migrations/2026-11-21-order-balance-payment.sql
-- (or paste it into phpMyAdmin's SQL tab with the lcj database selected)
--
-- orders.payment_id         = the downpayment (unchanged)
-- orders.balance_payment_id = the balance payment, a second row in payments (empty until it is recorded)
ALTER TABLE `orders`
  ADD COLUMN `balance_payment_id` int(11) DEFAULT NULL AFTER `payment_id`,
  ADD KEY `orders_balance_payment` (`balance_payment_id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`balance_payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL;
