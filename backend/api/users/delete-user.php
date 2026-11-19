<?php
// Soft-deletes a user from the admin Users page (their orders stay for the history).
// SuperAdmin only, like the Delete button on the page (the old server did not check this).
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin(2);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$id = (int) ($_POST['id'] ?? 0);
if (!$id) {
    json_response(['success' => false, 'error' => 'No user ID provided'], 422);
}
if ($id === $admin['id']) {
    json_response(['success' => false, 'error' => 'You cannot delete your own account.'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT username, email FROM users WHERE id = ? AND deleted = 0');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['success' => false, 'error' => 'User not found or already deleted'], 404);
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE user_id = ?');
    $stmt->execute([$id]);
    $order_count = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('UPDATE users SET deleted = 1 WHERE id = ?');
    $stmt->execute([$id]);
} catch (PDOException $e) {
    error_log('delete-user.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to delete user'], 500);
}

$details = "Soft deleted user: {$user['username']} ({$user['email']})";
if ($order_count > 0) {
    $details .= " - User has {$order_count} orders (preserved for history)";
}
log_action($pdo, $admin['username'], 'Soft Delete User', $details);

json_response(['success' => true]);
