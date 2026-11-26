-- Login security (v1.7.1):
--   1. login_attempts: counts wrong passwords per email. After 5 wrong tries the email must wait 15 minutes
--      (backend/helpers/login-limit.php). Rows are removed again after a successful login.
--   2. Password reset links are now saved as a hash (backend/api/auth/forgot-password.php), so the reset
--      tokens saved before this change can no longer be used: they are cleared here. Anyone who asked for a
--      reset link before simply asks again (Forgot Password).
-- Safe to run more than once.
-- Run once on the lcj database:
--   paste it into phpMyAdmin's SQL tab with the lcj database selected
--   (or: mysql -u <user> -p lcj < database/migrations/2026-11-26-login-security.sql)
-- Back up first (database/BACKUP.md).
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `email` varchar(255) NOT NULL,
  `failed` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

UPDATE `users` SET `password_reset_token` = NULL, `token_expiry` = NULL WHERE `password_reset_token` IS NOT NULL;
