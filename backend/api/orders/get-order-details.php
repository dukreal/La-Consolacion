<?php
// One order for the Details pop-up on the admin Orders page.
// GET ?order_id=N → the order, its customer and its products.
require_once __DIR__ . '/../../helpers/admin.php';

require_admin();

$order_id = (int) ($_GET['order_id'] ?? 0);
if (!$order_id) {
    json_response(['success' => false, 'error' => 'Order ID is required'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT o.id, o.status, o.payment_id, o.date_ordered, o.date_completed,
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
} catch (PDOException $e) {
    error_log('get-order-details.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

$total = 0;
foreach ($items as $item) {
    $total += $item['price_at_purchase'] * $item['quantity'];
}
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
        'service'       => $order['service'],
    ],
    'customer' => [
        'name'         => $order['username'],
        'email'        => $order['email'] ?? 'N/A',
        'mobile'       => $order['mobile'] ?? 'N/A',
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
    'total'    => $total,
]);
