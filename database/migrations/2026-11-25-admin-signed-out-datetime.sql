-- admin.last_signed_out: datetime, the same as last_signed_in.
-- It was first added as DATETIME (live databases have that), but database/lcj.sql made it a TIMESTAMP,
-- so a database built from lcj.sql had a different type. This makes every database the same.
-- Nothing in the code reads or writes this column yet, so no data changes; on a database that already
-- has DATETIME this does nothing harmful. Safe to run more than once.
-- Run once on the lcj database:
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-25-admin-signed-out-datetime.sql)
-- Back up first (database/BACKUP.md).
ALTER TABLE `admin`
  MODIFY COLUMN `last_signed_out` datetime DEFAULT NULL;
