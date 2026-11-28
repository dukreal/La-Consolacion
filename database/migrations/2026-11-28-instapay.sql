-- InstaPay (v1.9.0): the shop's QR is an InstaPay QR, so customers pay with any e-wallet or bank app and no
-- longer choose GCash, PayMaya or GoTyme. New payments are saved as InstaPay (online) or Cash / InstaPay (at the
-- store). This renames the e-wallet names saved before, in any spelling, to InstaPay; Cash stays Cash.
-- Only the payments.service column changes: amounts, reference numbers and screenshots stay as they are.
-- Safe to run more than once.
-- Run once on the lcj database:
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-28-instapay.sql)
-- Back up first (database/BACKUP.md).
UPDATE `payments`
SET `service` = 'InstaPay'
WHERE LOWER(`service`) IN ('gcash', 'paymaya', 'maya', 'gotyme');
