<?php
// Numbers and recent activity for the admin Overview page (was the PHP at the top of admin-overview.php).
//
// sales: the Sales card, for Today, This week and This month
//   received:  money that came in during the period: downpayments, balances (with any shipping fee) and walk-in
//              sales (payments by the day they were made; payments of cancelled or deleted orders, and balances paid
//              online that the admin has not checked yet, are left out)
//   payments:  how many payments that was
//   best:      the 5 items sold most in orders placed during the period (not cancelled or deleted, paid)
//   toCollect: what active orders (Pending, Processing, Waiting for Buyer) still owe, shipping fees included, and how many
//              orders that is; the same for every period
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

$count = function (string $where) use ($pdo): int {
    return (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE deleted = 0 $where")->fetchColumn();
};

try {
    $stats = [
        'totalOrders'      => $count(''),
        'pendingOrders'    => $count("AND status = 'pending'"),
        'processingOrders' => $count("AND status = 'processing'"),
        'waitingOrders'    => $count("AND status = 'waiting_for_buyer'"),
        // YEARWEEK (not WEEK) so the same week number of an earlier year is not counted
        'thisWeek'         => $count('AND YEARWEEK(date_ordered) = YEARWEEK(NOW())'),
    ];

    // The same periods as "This week" on the Orders page (YEARWEEK: the week starts on Sunday)
    $periods = [
        'today' => 'DATE(%s) = CURDATE()',
        'week'  => 'YEARWEEK(%s) = YEARWEEK(NOW())',
        'month' => "DATE_FORMAT(%s, '%%Y-%%m') = DATE_FORMAT(NOW(), '%%Y-%%m')",
    ];
    $sales = [];
    foreach ($periods as $key => $when) {
        // A payment belongs to an order as its downpayment (or walk-in payment) or as its balance.
        // A balance the customer paid online counts once the admin has checked it (balance_to_check = 0).
        $row = $pdo->query(
            "SELECT COALESCE(SUM(pay.amount), 0) AS received, COUNT(*) AS payments
             FROM payments pay
             JOIN orders o ON (o.payment_id = pay.id OR (o.balance_payment_id = pay.id AND o.balance_to_check = 0))
             WHERE o.deleted = 0 AND o.status <> 'cancelled' AND " . sprintf($when, 'pay.uploaded_at')
        )->fetch(PDO::FETCH_ASSOC);

        $best = $pdo->query(
            "SELECT p.name, SUM(oi.quantity) AS qty
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE o.deleted = 0 AND o.status <> 'cancelled' AND o.payment_id IS NOT NULL AND " . sprintf($when, 'o.date_ordered') . "
             GROUP BY p.id, p.name
             ORDER BY qty DESC, p.name ASC
             LIMIT 5"
        )->fetchAll(PDO::FETCH_ASSOC);

        $sales[$key] = [
            'received' => round((float) $row['received'], 2),
            'payments' => (int) $row['payments'],
            'best'     => array_map(fn ($b) => ['name' => $b['name'], 'qty' => (int) $b['qty']], $best),
        ];
    }

    // What each active, paid order still owes: its items and shipping fee, less the downpayment and any balance
    // already paid (a balance paid online counts once it is checked)
    $owed = $pdo->query(
        "SELECT COALESCE(SUM(GREATEST(t.total + COALESCE(o.shipping_fee, 0) - COALESCE(dp.amount, 0) - COALESCE(bp.amount, 0), 0)), 0) AS amount,
                COALESCE(SUM(t.total + COALESCE(o.shipping_fee, 0) - COALESCE(dp.amount, 0) - COALESCE(bp.amount, 0) > 0.004), 0) AS orders
         FROM orders o
         JOIN (SELECT order_id, SUM(price_at_purchase * quantity) AS total FROM order_items GROUP BY order_id) t ON t.order_id = o.id
         JOIN payments dp ON dp.id = o.payment_id
         LEFT JOIN payments bp ON bp.id = o.balance_payment_id AND o.balance_to_check = 0
         WHERE o.deleted = 0 AND o.status IN ('pending', 'processing', 'waiting_for_buyer')"
    )->fetch(PDO::FETCH_ASSOC);
    $sales['toCollect'] = ['amount' => round((float) $owed['amount'], 2), 'orders' => (int) $owed['orders']];

    $recent = $pdo->query(
        'SELECT logs.id, logs.user, logs.action, logs.details, logs.created_at, users.profile_image, users.first_name, users.role
         FROM logs
         LEFT JOIN users ON logs.user = users.username
         ORDER BY logs.created_at DESC, logs.id DESC
         LIMIT 3'
    )->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('overview.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

json_response([
    'success'  => true,
    'username' => $admin['username'],
    'stats'    => $stats,
    'sales'    => $sales,
    'recentActivity' => array_map(function ($log) {
        return [
            'id'           => (int) $log['id'],
            'user'         => $log['user'],
            'action'       => $log['action'],
            'details'      => $log['details'],
            'createdAt'    => $log['created_at'],
            'profileImage' => $log['profile_image'],
            'firstName'    => $log['first_name'],
            // 'admin' or 'user'; null if the account no longer exists
            'role'         => $log['role'],
        ];
    }, $recent),
]);
