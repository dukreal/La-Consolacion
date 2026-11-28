<?php
// One order for the Details pop-up on the admin Orders page.
// GET ?order_id=N → the order, its customer and its products, and how much is paid and still owed.
// Delivery orders also have their shipping fee, courier and tracking number, and a balance the customer paid online
// that waits to be checked (balanceSubmitted, with its screenshot).
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/payments.php';
require_once __DIR__ . '/../../helpers/delivery.php';

require_admin();

$order_id = (int) ($_GET['order_id'] ?? 0);
if (!$order_id) {
    json_response(['success' => false, 'error' => 'Order ID is required'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT o.id, o.status, o.payment_id, o.date_ordered, o.date_completed, o.fulfillment, ' . implode(', ', address_columns('o.delivery_')) . ',
                o.courier, o.tracking_number,
                u.username, u.email, u.profile_image, pay.reference_number, pay.service, pay.mobile
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN payments pay ON o.payment_id = pay.id
         WHERE o.id = ? AND o.deleted = 0'
    );
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        json_response(['success' => false, 'error' => 'Order not found'], 404);
    }

    $stmt = $pdo->prepare(
        'SELECT oi.product_id, oi.quantity, oi.price_at_purchase, p.name, p.description, p.image, p.type
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         ORDER BY oi.id'
    );
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $amounts = order_amounts($pdo, $order_id);

    // Custom orders: the phone number typed on the Add/Edit Custom Order form (custom_orders.id = the custom product's id)
    $stmt = $pdo->prepare(
        "SELECT c.phone FROM order_items oi
         JOIN products p ON p.id = oi.product_id AND p.type = 'custom'
         JOIN custom_orders c ON c.id = oi.product_id
         WHERE oi.order_id = ? AND c.phone IS NOT NULL AND c.phone <> '' LIMIT 1"
    );
    $stmt->execute([$order_id]);
    $custom_phone = $stmt->fetchColumn() ?: null;
} catch (PDOException $e) {
    error_log('get-order-details.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

$delivery = address_from_row($order, 'delivery_');

// The old pop-up had a spot for the customer's photo but never received one; now it does
$photo = $order['profile_image'] && is_file(__DIR__ . '/../../uploads/profile/' . $order['profile_image'])
    ? $order['profile_image'] : null;

json_response([
    'success'  => true,
    'order'    => [
        'id'            => (int) $order['id'],
        'status'        => strtolower($order['status'] ?? 'pending'),
        'paid'          => $order['payment_id'] !== null,
        'dateOrdered'   => $order['date_ordered'],
        'dateCompleted' => $order['date_completed'],
        'service'       => payment_service_name($order['service']),
        'fulfillment'   => $order['fulfillment'], // 'pickup' or 'delivery'
        // Delivery orders: where it goes, and the same address as text for the Copy address button
        'delivery'      => $delivery,
        'deliveryText'  => $delivery ? address_text($delivery) : null,
        'courier'        => $order['courier'],         // set when a delivery order ships, else null
        'trackingNumber' => $order['tracking_number'],
    ],
    'customer' => [
        'name'         => $order['username'],
        'email'        => $order['email'] ?? 'N/A',
        'mobile'       => $order['mobile'] ?? 'N/A', // the number used for the payment
        'customPhone'  => $custom_phone,             // custom orders: the number from the custom order form, or null
        'profileImage' => $photo,
        // Same test as the old pop-up: the walk-in account, or a cash sale
        'isWalkIn'     => $order['username'] === 'walkin_guest' || str_contains((string) $order['email'], 'walkin')
            || strtolower((string) $order['service']) === 'cash',
    ],
    'products' => array_map(fn ($item) => [
        'id'          => (int) $item['product_id'],
        'name'        => $item['name'],
        'description' => $item['description'],
        'image'       => $item['image'],
        'folder'      => $item['type'] === 'custom' ? 'custom' : 'products',
        'quantity'    => (int) $item['quantity'],
        'price'       => (float) $item['price_at_purchase'],
        'total'       => $item['price_at_purchase'] * $item['quantity'],
    ], $items),
    'itemsTotal'  => $amounts['itemsTotal'],
    'shippingFee' => $amounts['shippingFee'], // delivery orders, once set; else null
    'total'       => $amounts['total'],       // items + shipping fee
    // paid: downpayment (+ balance once recorded or checked); balance: what is left
    'downpayment' => $amounts['downpayment'],
    'paid'        => $amounts['paid'],
    'balance'     => $amounts['balance'],
    // The balance payment that counts, or null
    'balancePayment'   => $amounts['balancePayment'] ? [
        'service'         => $amounts['balancePayment']['service'],
        'referenceNumber' => $amounts['balancePayment']['reference_number'],
        'amount'          => $amounts['balancePayment']['amount'],
        'paidAt'          => $amounts['balancePayment']['uploaded_at'],
        // A screenshot the customer uploaded (uploads/payments/payment_...); store payments only have a logo
        'image'           => str_starts_with((string) $amounts['balancePayment']['image'], 'payment_') ? $amounts['balancePayment']['image'] : null,
    ] : null,
    // Paid online by the customer and not checked yet (image: uploads/payments), or null
    'balanceSubmitted' => $amounts['balanceSubmitted'] ? [
        'service'         => $amounts['balanceSubmitted']['service'],
        'referenceNumber' => $amounts['balanceSubmitted']['reference_number'],
        'amount'          => $amounts['balanceSubmitted']['amount'],
        'mobile'          => $amounts['balanceSubmitted']['mobile'],
        'image'           => $amounts['balanceSubmitted']['image'],
        'paidAt'          => $amounts['balanceSubmitted']['uploaded_at'],
    ] : null,
]);
