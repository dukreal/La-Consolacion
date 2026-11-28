<?php
// The admin Orders page: one page of orders (20), newest first, deleted ones left out. Each order has its products
// (items, with quantities; firstItem is the first of them), its total and its payment service.
// GET (all optional):
//   q       search: an order number (37, #37 or LCJ-0037), or part of the customer's name, username or email,
//           or of the delivery name
//   status  all (default), pending, processing, waiting_for_buyer, completed or cancelled
//   type    all (default), pickup or delivery
//   page    1 (default), 2, ...
// Also sends: stats (the stat cards: all orders, not only the ones found), counts (how many of each status
// match q and type: the numbers on the status buttons), matching (how many match everything), page, pages.
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

const ORDERS_PER_PAGE = 20;
const ORDER_STATUSES = ['pending', 'processing', 'waiting_for_buyer', 'completed', 'cancelled'];

$q = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 100);
$status = in_array($_GET['status'] ?? '', ORDER_STATUSES, true) ? $_GET['status'] : 'all';
$type = in_array($_GET['type'] ?? '', ['pickup', 'delivery'], true) ? $_GET['type'] : 'all';
$page = max(1, (int) ($_GET['page'] ?? 1));

// The search and type filters (not the status: the status buttons show a count for every status)
$where = ['o.deleted = 0'];
$params = [];
if ($type !== 'all') {
    $where[] = 'o.fulfillment = ?';
    $params[] = $type;
}
if ($q !== '') {
    // Part of a name or email: LIKE with % and _ taken literally
    $like = '%' . addcslashes($q, '%_\\') . '%';
    $match = ['u.username LIKE ?', 'u.email LIKE ?', "CONCAT(u.first_name, ' ', u.last_name) LIKE ?", 'o.delivery_name LIKE ?'];
    array_push($params, $like, $like, $like, $like);
    // An order number as the admin sees it (#37) or as the customer does (LCJ-0037)
    if (preg_match('/^(?:#|lcj-?)?\s*0*(\d{1,9})$/i', $q, $m)) {
        $match[] = 'o.id = ?';
        $params[] = (int) $m[1];
    }
    $where[] = '(' . implode(' OR ', $match) . ')';
}
$where_sql = implode(' AND ', $where);
$from = 'FROM orders o JOIN users u ON o.user_id = u.id';

try {
    // How many of each status match the search and type
    $stmt = $pdo->prepare("SELECT LOWER(o.status) AS status, COUNT(*) AS n {$from} WHERE {$where_sql} GROUP BY LOWER(o.status)");
    $stmt->execute($params);
    $counts = array_fill_keys(ORDER_STATUSES, 0);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (isset($counts[$row['status']])) {
            $counts[$row['status']] = (int) $row['n'];
        }
    }
    $counts = ['all' => array_sum($counts)] + $counts;

    // The page asked for (the last page if it no longer exists, e.g. after deleting its only order)
    $matching = $counts[$status];
    $pages = max(1, (int) ceil($matching / ORDERS_PER_PAGE));
    $page = min($page, $pages);

    $list_where = $where_sql;
    $list_params = $params;
    if ($status !== 'all') {
        $list_where .= ' AND LOWER(o.status) = ?';
        $list_params[] = $status;
    }
    $stmt = $pdo->prepare(
        "SELECT o.id, o.status, o.fulfillment, o.payment_id, o.date_ordered, o.shipping_fee,
                o.balance_payment_id, o.balance_to_check,
                u.username, u.role, u.first_name, u.profile_image, pay.service
         {$from}
         LEFT JOIN payments pay ON o.payment_id = pay.id
         WHERE {$list_where}
         ORDER BY o.date_ordered DESC, o.id DESC
         LIMIT " . ORDERS_PER_PAGE . ' OFFSET ' . (($page - 1) * ORDERS_PER_PAGE)
    );
    $stmt->execute($list_params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // The order items of these orders only, with their product (one query for the whole page)
    $items = [];
    if ($orders) {
        $ids = array_column($orders, 'id');
        $stmt = $pdo->prepare(
            'SELECT oi.order_id, oi.quantity, oi.price_at_purchase, p.name, p.image, p.type
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')
             ORDER BY oi.id'
        );
        $stmt->execute($ids);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // The stat cards: all orders (same as before), whatever is searched
    $stats = $pdo->query(
        "SELECT COUNT(*) AS total,
                COALESCE(SUM(LOWER(status) = 'pending'), 0) AS pending,
                COALESCE(SUM(LOWER(status) IN ('processing', 'waiting_for_buyer')), 0) AS processing,
                COALESCE(SUM(LOWER(status) = 'completed'), 0) AS completed
         FROM orders WHERE deleted = 0"
    )->fetch(PDO::FETCH_ASSOC);

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
    'stats'      => array_map('intval', $stats),
    'counts'     => $counts,
    'matching'   => $matching,
    'page'       => $page,
    'pages'      => $pages,
    'perPage'    => ORDERS_PER_PAGE,
    'orders'     => array_map(function ($o) use ($items_by_order, $profile_dir) {
        $order_items = $items_by_order[$o['id']] ?? [];
        $total = (float) ($o['shipping_fee'] ?? 0); // a delivery order's shipping fee, plus its items
        foreach ($order_items as $item) {
            $total += $item['price_at_purchase'] * $item['quantity'];
        }
        $first = $order_items[0] ?? null;
        // Every product of the order with its quantity (the list shows up to 3, then "+N more products")
        $products = array_map(fn ($item) => [
            'name'     => $item['name'],
            'image'    => $item['image'],
            'folder'   => $item['type'] === 'custom' ? 'custom' : 'products',
            'type'     => strtolower((string) $item['type']), // ring, charm, earring, bracelet or custom
            'quantity' => (int) $item['quantity'],
        ], $order_items);
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
            'items'        => $products,
            'firstItem'    => $first ? [
                'name'  => $first['name'],
                'image' => $first['image'],
                // Custom order pictures are in uploads/custom, the rest in uploads/products
                'folder' => $first['type'] === 'custom' ? 'custom' : 'products',
                'type' => strtolower((string) $first['type']),
                'quantity' => (int) $first['quantity'],
            ] : null,
        ];
    }, $orders),
]);
