<?php
session_start();
require_once __DIR__ . '/../../config/db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    // Get user's orders with order items and payment info
    $stmt = $pdo->prepare("
        SELECT 
            o.id as order_id,
            o.date_ordered,
            o.status,
            o.payment_id,
            o.date_completed,
            GROUP_CONCAT(
                CONCAT(oi.quantity, 'x ', p.name) 
                SEPARATOR ', '
            ) as order_items,
            SUM(oi.quantity * oi.price_at_purchase) as total_amount,
            MAX(p.type = 'custom') as is_custom,
            pay.reference_number,
            pay.service,
            pay.amount as payment_amount
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN payments pay ON o.payment_id = pay.id
        WHERE o.user_id = ? AND o.deleted = 0 AND o.payment_id IS NOT NULL
        GROUP BY o.id
        ORDER BY o.date_ordered DESC
    ");
    
    $stmt->execute([$user_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format orders for display
    $formattedOrders = [];
    foreach ($orders as $order) {
        // The status color and wording are decided by the website (frontend/src/utils/orderStatus.js)
        $formattedOrders[] = [
            'order_id' => $order['order_id'],
            'order_date' => date('M d, Y', strtotime($order['date_ordered'])),
            'total_amount' => number_format($order['total_amount'] ?: 0, 2),
            'status' => $order['status'],
            'order_items' => $order['order_items'] ?: 'No items',
            'can_cancel' => in_array($order['status'], ['pending', 'processing', 'confirmed', 'waiting_for_buyer']),
            'payment_id' => $order['payment_id'],
            'date_completed' => $order['date_completed'],
            'reference_number' => $order['reference_number'],
            'service' => $order['service'],
            'payment_amount' => $order['payment_amount'],
            // Custom orders are paid with a 30% downpayment, so the card shows both amounts
            'is_custom' => (bool) $order['is_custom']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'orders' => $formattedOrders,
        'total_orders' => count($formattedOrders)
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?> 