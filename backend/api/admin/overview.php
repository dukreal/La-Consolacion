<?php
// Numbers and recent activity for the admin Overview page (was the PHP at the top of admin-overview.php).
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

    $recent = $pdo->query(
        'SELECT logs.id, logs.user, logs.action, logs.details, logs.created_at, users.profile_image, users.first_name
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
    'recentActivity' => array_map(function ($log) {
        return [
            'id'           => (int) $log['id'],
            'user'         => $log['user'],
            'action'       => $log['action'],
            'details'      => $log['details'],
            'createdAt'    => $log['created_at'],
            'profileImage' => $log['profile_image'],
            'firstName'    => $log['first_name'],
        ];
    }, $recent),
]);
