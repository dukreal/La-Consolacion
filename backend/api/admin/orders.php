<?php
// All orders for the admin Orders page (was the PHP at the top of admin-orders.php).
// Newest first, deleted ones left out. Each order has its first product, its total and its payment service.
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

try {
    $orders = $pdo->query(
        'SELECT o.id, o.status, o.fulfillment, o.payment_id, o.date_ordered, o.shipping_fee,
                o.balance_payment_id, o.balance_to_check,
                u.username, u.role, u.first_name, u.profile_image, pay.service
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN payments pay ON o.payment_id = pay.id
         WHERE o.deleted = 0
         ORDER BY o.date_ordered DESC, o.id DESC'
    )->fetchAll(PDO::FETCH_ASSOC);

    // All order items with their product, grouped by order (one query instead of one per row)
    $items = $pdo->query(
        'SELECT oi.order_id, oi.quantity, oi.price_at_purchase, p.name, p.image, p.type
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         ORDER BY oi.id'
    )->fetchAll(PDO::FETCH_ASSOC);

    // "This week" on the Total Orders card, counted exactly like the Overview page (YEARWEEK, not WEEK)
    $this_week = (int) $pdo->query(
        'SELECT COUNT(*) FROM orders WHERE deleted = 0 AND YEARWEEK(date_ordered) = YEARWEEK(NOW())'
    )->fetchColumn();
} catch (PDOException $e) {
    error_log('orders.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

$items_by_order = [];
foreach ($items as $item) {
    $items_by_order[$item['order_id']][] = $item;
}

$profile_dir = __DIR__ . '/../../uploads/profile/';

json_response([
    'success'    => true,
    'adminLevel' => $admin['admin_level'], // 2 = SuperAdmin: sees the Delete button
    'thisWeek'   => $this_week,
    'orders'     => array_map(function ($o) use ($items_by_order, $profile_dir) {
        $order_items = $items_by_order[$o['id']] ?? [];
        $total = (float) ($o['shipping_fee'] ?? 0); // a delivery order's shipping fee, plus its items
        foreach ($order_items as $item) {
            $total += $item['price_at_purchase'] * $item['quantity'];
        }
        $first = $order_items[0] ?? null;
        // Only send the photo if the file is really there (the old page checked file_exists too)
        $photo = $o['profile_image'] && is_file($profile_dir . $o['profile_image']) ? $o['profile_image'] : null;

        return [
            'id'           => (int) $o['id'],
            'status'       => strtolower($o['status']),
            'fulfillment'  => $o['fulfillment'], // 'pickup' or 'delivery' (walk-in sales are pickup)
            'paid'         => $o['payment_id'] !== null,
            'paymentId'    => $o['payment_id'] !== null ? (int) $o['payment_id'] : null,
            'dateOrdered'  => $o['date_ordered'],
            'username'     => $o['username'],
            'role'         => $o['role'],
            'isWalkIn'     => $o['username'] === 'walkin_guest',
            'profileImage' => $photo,
            'service'      => $o['service'],
            'total'        => $total,
            // The customer paid the rest online and it waits to be checked ("Balance submitted" label)
            'balanceToCheck' => $o['balance_payment_id'] !== null && (int) $o['balance_to_check'] === 1,
            'firstItem'    => $first ? [
                'name'  => $first['name'],
                'image' => $first['image'],
                // Custom order pictures are in uploads/custom, the rest in uploads/products
                'folder' => $first['type'] === 'custom' ? 'custom' : 'products',
            ] : null,
        ];
    }, $orders),
]);
