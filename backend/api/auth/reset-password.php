<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = read_json();
$token = $input['token'] ?? '';
$new_password = $input['new_password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';

if ($new_password !== $confirm_password) {
    json_response(['success' => false, 'message' => 'Passwords do not match.'], 422);
}
if (strlen($new_password) < 6) {
    json_response(['success' => false, 'message' => 'Password must be at least 6 characters.'], 422);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE password_reset_token = ? AND token_expiry > NOW()');
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['success' => false, 'message' => 'Invalid or expired token.'], 400);
}

$hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password = ?, password_reset_token = NULL, token_expiry = NULL WHERE id = ?');
$stmt->execute([$hash, $user['id']]);

json_response(['success' => true, 'message' => 'Password reset successful!']);