<?php
// The logged-in customer's orders for the order history in Profile, newest first.
// Only paid orders are listed: an unpaid custom order waits for its payment link instead.
// The status colour and wording are decided by the website (frontend/src/utils/orderStatus.js).
require_once __DIR__ . '/../../helpers/customer.php';

$user_id = require_customer();

try {
    $stmt = $pdo->prepare(
        "SELECT o.id AS order_id, o.date_ordered, o.status, o.fulfillment, o.payment_id, o.date_completed,
                o.shipping_fee, o.balance_to_check,
                GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p.name) ORDER BY oi.id SEPARATOR ', ') AS order_items,
                SUBSTRING_INDEX(GROUP_CONCAT(p.name ORDER BY oi.id SEPARATOR '\n'), '\n', 1) AS first_item,
                COUNT(oi.id) AS item_lines,
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
    // The items plus the shipping fee of a delivery order (helpers/payments.php, order_amounts(), counts the same way)
    $total = (float) ($o['total_amount'] ?? 0) + (float) ($o['shipping_fee'] ?? 0);
    // A balance paid online counts once the shop has checked it (orders.balance_to_check = 0)
    $to_check = $o['balance_amount'] !== null && (int) $o['balance_to_check'] === 1;
    $balance_paid = $o['balance_amount'] !== null && !$to_check ? (float) $o['balance_amount'] : 0;
    // What is still owed: 0 once the balance is paid, when it was paid in full,
    // or when the order was cancelled (nothing more to pay)
    $balance = $o['status'] === 'cancelled'
        ? 0
        : max(0, round($total - (float) $o['payment_amount'] - $balance_paid, 2));

    return [
        'order_id'         => $o['order_id'],
        'order_date'       => date('M d, Y', strtotime($o['date_ordered'])),
        'total_amount'     => number_format($total, 2),
        'status'           => $o['status'],
        'fulfillment'      => $o['fulfillment'], // 'pickup' or 'delivery'
        'order_items'      => $o['order_items'] ?: 'No items',
        'first_item'       => $o['first_item'],          // the card's title: "Crown Diamond Ring"
        'item_lines'       => (int) $o['item_lines'],    // ... "+ 2 more" when there are more products
        'can_cancel'       => customer_can_cancel($o['status']),
        'payment_id'       => $o['payment_id'],
        'date_completed'   => $o['date_completed'],
        'reference_number' => $o['reference_number'],
        'service'          => $o['service'],
        'payment_amount'   => $o['payment_amount'],
        'is_custom'        => (bool) $o['is_custom'], // custom orders show the downpayment and the total
        'balance'          => $balance,
        'balance_paid'     => $o['balance_amount'] !== null && !$to_check,
        'balance_to_check' => $to_check, // paid online, the shop is checking it
        'shipping_fee'     => $o['shipping_fee'] !== null ? (float) $o['shipping_fee'] : null,
    ];
}, $rows);

json_response(['success' => true, 'orders' => $orders, 'total_orders' => count($orders)]);
