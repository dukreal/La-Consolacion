<?php
// One of the logged-in customer's orders, for the Details pop-up in their order history:
// the order, the customer, the products, the downpayment, the balance paid and what is still owed.
// Delivery orders also have their shipping fee, courier and tracking number, and whether the rest can be paid online.
// GET: order_id. Errors answer { success: false, error }.
// The status colour and wording are decided by the website (frontend/src/utils/orderStatus.js).
require_once __DIR__ . '/../../helpers/customer.php';
require_once __DIR__ . '/../../helpers/payments.php'; // order_amounts()
require_once __DIR__ . '/../../helpers/delivery.php';

$user_id = require_customer();

$order_id = (int) ($_GET['order_id'] ?? 0);
if ($order_id < 1) {
    json_response(['success' => false, 'error' => 'Order ID is required'], 400);
}

try {
    // Only the customer's own orders
    $stmt = $pdo->prepare(
        'SELECT o.id, o.status, o.date_ordered, o.date_completed, o.fulfillment, ' . implode(', ', address_columns('o.delivery_')) . ',
                o.shipping_fee, o.courier, o.tracking_number,
                u.email, u.first_name, u.last_name,
                pay.reference_number, pay.service, pay.mobile, pay.amount, pay.uploaded_at
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN payments pay ON o.payment_id = pay.id
         WHERE o.id = ? AND o.user_id = ? AND o.deleted = 0'
    );
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch();
    if (!$order) {
        json_response(['success' => false, 'error' => 'Order not found'], 404);
    }

    $stmt = $pdo->prepare(
        'SELECT oi.product_id, oi.quantity, oi.price_at_purchase,
                p.name, p.description, p.image, p.type
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         ORDER BY oi.id' // the same order as the order history card, so both name the same first product
    );
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll();

    $amounts = order_amounts($pdo, $order_id); // total, downpayment + balance paid, and what is still owed
} catch (PDOException $e) {
    error_log('get-user-order-details.php database error: ' . $e->getMessage()); // details for the server log only
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

$status = $order['status'] ?: 'pending';

json_response([
    'order' => [
        'id'               => $order['id'],
        'date_ordered'     => $order['date_ordered'],
        'date_completed'   => $order['date_completed'],
        'status'           => $status,
        'reference_number' => $order['reference_number'],
        'service'          => payment_service_name($order['service']),
        'fulfillment'      => $order['fulfillment'],                  // 'pickup' or 'delivery'
        'delivery'         => address_from_row($order, 'delivery_'), // where a delivery order goes, or null
        'courier'          => $order['courier'],         // once a delivery order ships, else null
        'tracking_number'  => $order['tracking_number'],
    ],
    'customer' => [
        'name'   => $order['first_name'] . ' ' . $order['last_name'],
        'email'  => $order['email'] ?? 'N/A',
        'mobile' => $order['mobile'] ?? 'N/A',
    ],
    'products' => array_map(fn (array $item): array => [
        'id'          => $item['product_id'],
        'name'        => $item['name'],
        'description' => $item['description'],
        'image'       => $item['image'],
        'type'        => $item['type'],
        'quantity'    => $item['quantity'],
        'price'       => $item['price_at_purchase'],
        'total'       => $item['price_at_purchase'] * $item['quantity'],
    ], $items),
    'payment' => [
        'reference_number' => $order['reference_number'],
        'service'          => payment_service_name($order['service']),
        'amount'           => $order['amount'],
        'uploaded_at'      => $order['uploaded_at'],
        'mobile'           => $order['mobile'],
    ],
    'items_total'     => $amounts['itemsTotal'],
    'shipping_fee'    => $amounts['shippingFee'], // delivery orders, once the shop sets it; else null
    'total'           => $amounts['total'],       // items + shipping fee
    'balance_payment' => $amounts['balancePayment'] ? array_intersect_key(
        $amounts['balancePayment'], array_flip(['service', 'reference_number', 'amount', 'uploaded_at'])
    ) : null, // { service, reference_number, amount, uploaded_at } or null
    // Paid online and the shop is checking it: { service, reference_number, amount, uploaded_at } or null
    'balance_submitted' => $amounts['balanceSubmitted'] ? array_intersect_key(
        $amounts['balanceSubmitted'], array_flip(['service', 'reference_number', 'amount', 'uploaded_at'])
    ) : null,
    'can_pay'         => can_pay_online($order, $amounts), // shows the Pay button
    'balance'         => $status === 'cancelled' ? 0 : $amounts['balance'], // nothing more to pay on a cancelled order
    'can_cancel'      => customer_can_cancel($status),
]);
