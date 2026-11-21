<?php
// Soft-deletes an order from the admin Orders page (hides it; the row stays in the database).
// SuperAdmin only: only SuperAdmins see the Delete button, and the old file did not check
// anything on the server, so anyone could delete orders.
// Only finished orders (Completed or Cancelled) and unpaid ones can be deleted. An unpaid order (a custom order
// the customer never paid) took no stock and the customer does not see it. A paid, active order is cancelled
// first from its Details pop-up, which puts the stock back and emails the customer; deleting it would only hide it.
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
    $stmt = $pdo->prepare('SELECT status, payment_id FROM orders WHERE id = ? AND deleted = 0');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) {
        json_response(['success' => false, 'error' => 'Order not found or already deleted'], 404);
    }
    if ($order['payment_id'] !== null && !in_array($order['status'], ['completed', 'cancelled'], true)) {
        json_response(['success' => false, 'error' => 'Cancel this order first: open Details and change its status to Cancelled. Then you can delete it.'], 422);
    }

    // Checked again here, in case the order was paid or changed in the meantime
    $stmt = $pdo->prepare("UPDATE orders SET deleted = 1 WHERE id = ? AND deleted = 0 AND (payment_id IS NULL OR status IN ('completed', 'cancelled'))");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        json_response(['success' => false, 'error' => 'This order changed in the meantime. Please refresh the page.'], 409);
    }
} catch (PDOException $e) {
    error_log('delete-order.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to delete order.'], 500);
}

log_action($pdo, $admin['username'], 'Delete Order', "Deleted Order ID: {$id}");

json_response(['success' => true]);
