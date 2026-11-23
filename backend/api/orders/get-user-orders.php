<?php
// The logged-in customer's orders for the order history in Profile, newest first.
// Only paid orders are listed: an unpaid custom order waits for its payment link instead.
// The status colour and wording are decided by the website (frontend/src/utils/orderStatus.js).
require_once __DIR__ . '/../../helpers/customer.php';

$user_id = require_customer();

try {
    $stmt = $pdo->prepare(
        "SELECT o.id AS order_id, o.date_ordered, o.status, o.payment_id, o.date_completed,
                GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p.name) SEPARATOR ', ') AS order_items,
                SUM(oi.quantity * oi.price_at_purchase) AS total_amount,
                MAX(p.type = 'custom') AS is_custom,
                pay.reference_number, pay.service, pay.amount AS payment_amount,
                bal.amount AS balance_amount
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         LEFT JOIN payments pay ON o.payment_id = pay.id
         LEFT JOIN payments bal ON o.balance_payment_id = bal.id
         WHERE o.user_id = ? AND o.deleted = 0 AND o.payment_id IS NOT NULL
         GROUP BY o.id
         ORDER BY o.date_ordered DESC"
    );
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log('get-user-orders.php database error: ' . $e->getMessage()); // details for the server log only
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

$orders = array_map(function (array $o): array {
    $total = (float) ($o['total_amount'] ?? 0);
    // What is still owed at pickup: 0 once the balance is recorded, when it was paid in full,
    // or when the order was cancelled (nothing more to pay)
    $balance = $o['status'] === 'cancelled'
        ? 0
        : max(0, round($total - (float) $o['payment_amount'] - (float) $o['balance_amount'], 2));

    return [
        'order_id'         => $o['order_id'],
        'order_date'       => date('M d, Y', strtotime($o['date_ordered'])),
        'total_amount'     => number_format($total, 2),
        'status'           => $o['status'],
        'order_items'      => $o['order_items'] ?: 'No items',
        'can_cancel'       => customer_can_cancel($o['status']),
        'payment_id'       => $o['payment_id'],
        'date_completed'   => $o['date_completed'],
        'reference_number' => $o['reference_number'],
        'service'          => $o['service'],
        'payment_amount'   => $o['payment_amount'],
        'is_custom'        => (bool) $o['is_custom'], // custom orders show the downpayment and the total
        'balance'          => $balance,
        'balance_paid'     => $o['balance_amount'] !== null,
    ];
}, $rows);

json_response(['success' => true, 'orders' => $orders, 'total_orders' => count($orders)]);
