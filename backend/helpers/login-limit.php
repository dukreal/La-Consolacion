<?php
// Limits wrong passwords, so nobody can guess a password by trying again and again.
// After LOGIN_MAX_TRIES wrong passwords for one email (within LOGIN_LOCK_MINUTES), that email is locked for
// LOGIN_LOCK_MINUTES: the password is not even checked until then. It counts every email that is typed,
// also ones with no account, so the answer never shows which emails have an account.
// Used by api/auth/login.php and api/auth/resend-verification.php (both check a password); a successful
// login or password reset clears the count. Kept in the login_attempts table (one row per email).
const LOGIN_MAX_TRIES = 5;
const LOGIN_LOCK_MINUTES = 15;

// The same email however it was typed (spaces, capital letters)
function login_key(string $email): string
{
    return strtolower(trim($email));
}

// Minutes left while the email is locked, or 0 when it may try a password
function login_locked_minutes(PDO $pdo, string $email): int
{
    $stmt = $pdo->prepare('SELECT TIMESTAMPDIFF(SECOND, NOW(), locked_until) FROM login_attempts WHERE email = ? AND locked_until > NOW()');
    $stmt->execute([login_key($email)]);
    $seconds = (int) $stmt->fetchColumn();
    return $seconds > 0 ? (int) ceil($seconds / 60) : 0;
}

// One more wrong password. A count older than LOGIN_LOCK_MINUTES starts again from 1.
// Returns the minutes of the lock when this one locked the email, otherwise 0.
function login_failed(PDO $pdo, string $email): int
{
    $key = login_key($email);
    $pdo->prepare(
        'INSERT INTO login_attempts (email, failed) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE failed = IF(updated_at < NOW() - INTERVAL ' . LOGIN_LOCK_MINUTES . ' MINUTE, 1, failed + 1)'
    )->execute([$key]);
    $lock = $pdo->prepare(
        'UPDATE login_attempts SET failed = 0, locked_until = NOW() + INTERVAL ' . LOGIN_LOCK_MINUTES . ' MINUTE
         WHERE email = ? AND failed >= ' . LOGIN_MAX_TRIES
    );
    $lock->execute([$key]);
    return $lock->rowCount() > 0 ? LOGIN_LOCK_MINUTES : 0;
}

// The right password (or a new one was set): forget the wrong tries
function login_succeeded(PDO $pdo, string $email): void
{
    $pdo->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([login_key($email)]);
}

// The message for a locked email (HTTP 429: too many tries)
function login_locked_response(int $minutes): void
{
    $wait = $minutes === 1 ? '1 minute' : "{$minutes} minutes";
    json_response([
        'success' => false,
        'error' => "Too many wrong passwords. Please wait {$wait} and try again, or use Forgot Password to set a new one.",
    ], 429);
}
