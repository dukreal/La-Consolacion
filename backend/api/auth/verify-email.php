<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

$token = $_GET['token'] ?? '';
if ($token === '') {
    json_response(['success' => false, 'message' => 'No verification token provided.'], 400);
}

$stmt = $pdo->prepare('SELECT id, token_expires_at FROM users WHERE verification_token = ? AND is_verified = 0');
$stmt->execute([$token]);
$user = $stmt->fetch();

if ($user && strtotime($user['token_expires_at']) > time()) {
    // Mark as verified
    $stmt = $pdo->prepare('UPDATE users SET is_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE id = ?');
    $stmt->execute([$user['id']]);
    json_response(['success' => true, 'message' => 'Your account has been verified!']);
}

json_response(['success' => false, 'message' => 'Invalid or expired verification link.'], 400);