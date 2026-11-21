<?php
// The customer cancels one of their own orders from their order history.
// POST form: order_id. Answers { success, message } or { success: false, error }.
// Pending, Processing and Ready for Pickup orders can be cancelled (helpers/customer.php).
// The items go back into stock (helpers/stock.php). No email is sent: the customer did it themselves.
require_once __DIR__ . '/../../helpers/customer.php';
require_once __DIR__ . '/../../helpers/stock.php';

$user_id = require_customer();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$order_id = (int) ($_POST['order_id'] ?? 0);
if ($order_id < 1) {
    json_response(['success' => false, 'error' => 'Order ID is required'], 422);
}

try {
    // Only the customer's own orders
    $stmt = $pdo->prepare('SELECT status FROM orders WHERE id = ? AND user_id = ? AND deleted = 0');
    $stmt->execute([$order_id, $user_id]);
    $status = $stmt->fetchColumn();
} catch (PDOException $e) {
    error_log('cancel-order.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
}

if ($status === false) {
    json_response(['success' => false, 'error' => 'Order not found'], 404);
}
// Already cancelled is checked first, so the customer gets the clearer message
if ($status === 'cancelled') {
    json_response(['success' => false, 'error' => 'This order is already cancelled.'], 422);
}
if (!customer_can_cancel($status)) {
    json_response(['success' => false, 'error' => 'This order can no longer be cancelled because it is already ' . str_replace('_', ' ', $status) . '.'], 422);
}

try {
    $pdo->beginTransaction();

    // Cancel only while the order can still be cancelled, so two clicks (or the shop cancelling
    // at the same moment) cannot put the stock back twice
    $placeholders = implode(', ', array_fill(0, count(CUSTOMER_CANCELLABLE_STATUSES), '?'));
    $stmt = $pdo->prepare("UPDATE orders SET status = 'cancelled', date_completed = NOW() WHERE id = ? AND status IN ($placeholders)");
    $stmt->execute([$order_id, ...CUSTOMER_CANCELLABLE_STATUSES]);
    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        json_response(['success' => false, 'error' => 'This order can no longer be cancelled. Please refresh the page.'], 409);
    }

    restore_order_stock($pdo, $order_id);

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('cancel-order.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Something went wrong. Please try again.'], 500);
}

json_response(['success' => true, 'message' => "Order #{$order_id} has been cancelled.", 'order_id' => $order_id]);
