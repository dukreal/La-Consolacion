<?php
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/stock.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit();
}

// Check if order ID is provided
if (!isset($_POST['order_id'])) {
    echo json_encode(['success' => false, 'error' => 'Order ID is required']);
    exit();
}

$user_id = $_SESSION['user_id'];
$order_id = $_POST['order_id'];

try {
    // Check if order exists and belongs to user
    $stmt = $pdo->prepare("
        SELECT o.id, o.status, SUM(oi.quantity * oi.price_at_purchase) as total_amount
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ? AND o.user_id = ? AND o.deleted = 0
        GROUP BY o.id
    ");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    // Already cancelled (checked first, so the customer gets the clearer message)
    if ($order['status'] === 'cancelled') {
        echo json_encode(['success' => false, 'error' => 'This order is already cancelled.']);
        exit();
    }

    // Orders that are ready for pickup or completed can no longer be cancelled
    $cancellableStatuses = ['pending', 'processing', 'confirmed', 'waiting_for_buyer'];
    if (!in_array($order['status'], $cancellableStatuses)) {
        $statusText = str_replace('_', ' ', $order['status']);
        echo json_encode(['success' => false, 'error' => 'This order can no longer be cancelled because it is already ' . $statusText . '.']);
        exit();
    }

    $pdo->beginTransaction();

    // Cancel only while the order can still be cancelled, so two clicks (or the shop cancelling
    // at the same moment) cannot put the stock back twice
    $stmt = $pdo->prepare("
        UPDATE orders
        SET status = 'cancelled', date_completed = NOW()
        WHERE id = ? AND status IN ('pending', 'processing', 'confirmed', 'waiting_for_buyer')
    ");
    $stmt->execute([$order_id]);
    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'This order can no longer be cancelled. Please refresh the page.']);
        exit();
    }

    // Put the items back into stock (helpers/stock.php, shared with the admin's Cancelled status)
    restore_order_stock($pdo, (int) $order_id);

    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Order #' . $order_id . ' has been cancelled.',
        'order_id' => $order_id
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('cancel-order.php database error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Something went wrong. Please try again.']);
}
?> 