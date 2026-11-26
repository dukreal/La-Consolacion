<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/login-limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = read_json();
$token = $input['token'] ?? '';
$new_password = $input['new_password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';

if (!is_string($token) || $token === '') {
    json_response(['success' => false, 'message' => 'Invalid or expired token.'], 400);
}
if ($new_password !== $confirm_password) {
    json_response(['success' => false, 'message' => 'Passwords do not match.'], 422);
}
if (strlen($new_password) < 6) {
    json_response(['success' => false, 'message' => 'Password must be at least 6 characters.'], 422);
}

// The database keeps only a hash of the token (api/auth/forgot-password.php)
$stmt = $pdo->prepare('SELECT id, email FROM users WHERE password_reset_token = ? AND token_expiry > NOW()');
$stmt->execute([hash('sha256', $token)]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['success' => false, 'message' => 'Invalid or expired token.'], 400);
}

$hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password = ?, password_reset_token = NULL, token_expiry = NULL WHERE id = ?');
$stmt->execute([$hash, $user['id']]);
login_succeeded($pdo, $user['email']); // a new password: a lock from wrong tries ends too

json_response(['success' => true, 'message' => 'Password reset successful!']);