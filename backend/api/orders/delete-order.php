<?php
// Soft-deletes an order from the admin Orders page (hides it; the row stays in the database).
// SuperAdmin only: only SuperAdmins see the Delete button, and the old file did not check
// anything on the server, so anyone could delete orders.
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin(2);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request method'], 405);
}

$id = (int) ($_POST['id'] ?? 0);
if (!$id) {
    json_response(['success' => false, 'error' => 'No order ID provided'], 422);
}

try {
    $stmt = $pdo->prepare('UPDATE orders SET deleted = 1 WHERE id = ? AND deleted = 0');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        json_response(['success' => false, 'error' => 'Order not found or already deleted'], 404);
    }
} catch (PDOException $e) {
    error_log('delete-order.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to delete order.'], 500);
}

log_action($pdo, $admin['username'], 'Delete Order', "Deleted Order ID: {$id}");

json_response(['success' => true]);
