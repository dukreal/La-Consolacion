<?php
// Paginated activity logs for the admin Logs page (was the PHP at the top of admin-logs.php).
// GET ?page=N  → 8 logs per page, newest first.
// GET ?type=orders|products|users  → only that kind of action (across all logs; anything else means all).
require_once __DIR__ . '/../../helpers/admin.php';

require_admin();

$perPage = 8; // same as the old page: fits the screen without scrolling
$page    = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;

// The action names each Type chip covers (these are every name the backend writes with log_action)
$TYPES = [
    'orders'   => ['Change Order Status', 'Delete Order', 'Email Notification', 'Email Notification Failed'],
    'products' => ['Add Product', 'Edit Product', 'Delete Product', 'Add Custom Order', 'Edit Custom Order'],
    'users'    => ['Register User', 'Admin Create User', 'Edit User', 'Soft Delete User', 'Resend Verification'],
];
$type    = isset($_GET['type'], $TYPES[$_GET['type']]) ? $_GET['type'] : '';
$actions = $type ? $TYPES[$type] : [];
$where   = $actions ? 'WHERE logs.action IN (' . implode(',', array_fill(0, count($actions), '?')) . ')' : '';

try {
    $count = $pdo->prepare("SELECT COUNT(*) FROM logs $where");
    $count->execute($actions);
    $total      = (int) $count->fetchColumn();
    $totalPages = (int) ceil($total / $perPage);

    // Asking for a page past the end shows the last page instead of an empty table
    if ($totalPages > 0 && $page > $totalPages) {
        $page = $totalPages;
    }
    $offset = ($page - 1) * $perPage;

    // The old page ran a second query per row to look the user up again;
    // that returned the same data as this JOIN, so one query is enough.
    $stmt = $pdo->prepare(
        'SELECT logs.id, logs.user, logs.action, logs.details, logs.created_at,
                users.username AS current_username, users.first_name, users.profile_image
         FROM logs
         LEFT JOIN users ON logs.user = users.username
         ' . $where . '
         ORDER BY logs.created_at DESC, logs.id DESC
         LIMIT ? OFFSET ?'
    );
    $n = 1;
    foreach ($actions as $action) {
        $stmt->bindValue($n++, $action);
    }
    $stmt->bindValue($n++, $perPage, PDO::PARAM_INT);
    $stmt->bindValue($n, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('logs.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

json_response([
    'success'    => true,
    'type'       => $type,
    'page'       => $page,
    'perPage'    => $perPage,
    'total'      => $total,
    'totalPages' => $totalPages,
    'logs'       => array_map(function ($log) {
        return [
            'id'           => (int) $log['id'],
            'user'         => $log['current_username'] ?? $log['user'],
            'action'       => $log['action'] ?? '',
            'details'      => $log['details'] ?? '',
            'createdAt'    => $log['created_at'] ?? '',
            'profileImage' => $log['profile_image'],
            'firstName'    => $log['first_name'],
        ];
    }, $logs),
]);
