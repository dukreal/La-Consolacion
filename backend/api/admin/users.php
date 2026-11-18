<?php
// All users (not deleted), newest first, for the admin Users page (was the PHP at the top of admin-users.php).
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

try {
    $rows = $pdo->query(
        'SELECT u.id, u.username, u.email, u.role, u.created_at, u.profile_image, u.first_name, u.last_name, a.admin_level
         FROM users u
         LEFT JOIN admin a ON u.id = a.user_id
         WHERE u.deleted = 0
         ORDER BY u.created_at DESC, u.id DESC'
    )->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('users.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

json_response([
    'success'     => true,
    'currentUserId' => $admin['id'],
    'adminLevel'  => $admin['admin_level'], // the page shows Delete and the role dropdown only for 2 (SuperAdmin)
    'users' => array_map(function ($u) {
        return [
            'id'           => (int) $u['id'],
            'username'     => $u['username'],
            'email'        => $u['email'],
            'firstName'    => $u['first_name'] ?? '',
            'lastName'     => $u['last_name'] ?? '',
            'profileImage' => $u['profile_image'],
            'createdAt'    => $u['created_at'],
            // 'user', 'admin-1' or 'admin-2' (the same values the old edit form used)
            'role'         => $u['role'] === 'admin' ? 'admin-' . ((int) $u['admin_level'] === 2 ? 2 : 1) : 'user',
        ];
    }, $rows),
]);
