<?php
// Admin check for the JSON endpoints used by the React admin pages.
// Same rules as the old middleware/admin-check.php (which redirected instead of answering JSON):
//   - the user must be logged in and not deleted
//   - the role is read from the database on every request, so a demoted admin loses access at once
//   - $min_level 2 means SuperAdmin only (1 = Admin, 2 = SuperAdmin)
// Returns the current admin: ['id', 'username', 'role', 'admin_level'].
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/json.php';

function require_admin(int $min_level = 1): array
{
    global $pdo;
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!isset($_SESSION['user_id'])) {
        json_response(['success' => false, 'error' => 'login', 'message' => 'Please login to access this page.'], 401);
    }

    try {
        $stmt = $pdo->prepare('SELECT u.id, u.username, u.role, a.admin_level FROM users u LEFT JOIN admin a ON u.id = a.user_id WHERE u.id = ? AND u.deleted = 0');
        $stmt->execute([$_SESSION['user_id']]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('Admin check database error: ' . $e->getMessage());
        json_response(['success' => false, 'error' => 'system_error', 'message' => 'System error. Please try again.'], 500);
    }

    if (!$admin) {
        session_destroy();
        json_response(['success' => false, 'error' => 'user_not_found', 'message' => 'User account not found or has been deleted.'], 401);
    }
    if ($admin['role'] !== 'admin' || $admin['admin_level'] === null) {
        json_response(['success' => false, 'error' => 'admin', 'message' => 'Only authorized personnel are allowed.'], 403);
    }

    // Keep the session in step with the database (the old pages did the same)
    $_SESSION['role'] = $admin['role'];
    $_SESSION['admin_level'] = (int) $admin['admin_level'];

    if ((int) $admin['admin_level'] < $min_level) {
        json_response(['success' => false, 'error' => 'level', 'message' => 'Insufficient permissions. Only SuperAdmin can do this.'], 403);
    }

    $admin['id'] = (int) $admin['id'];
    $admin['admin_level'] = (int) $admin['admin_level'];
    return $admin;
}
