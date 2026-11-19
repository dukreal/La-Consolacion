<?php
// Saves the "Edit User" form of the admin Users page.
// Any admin may change names, username and email. Only a SuperAdmin may change the role
// (the old page hid the role dropdown from Admins, but the server did not check it).
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$id = (int) ($_POST['id'] ?? 0);
$first_name = trim($_POST['first_name'] ?? '');
$last_name = trim($_POST['last_name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$role = $_POST['role'] ?? null; // 'user', 'admin-1' or 'admin-2'; only sent by SuperAdmins

$labels = ['user' => 'Customer', 'admin-1' => 'Admin', 'admin-2' => 'SuperAdmin'];

if ($role !== null) {
    if ($admin['admin_level'] < 2) {
        json_response(['success' => false, 'error' => 'Insufficient permissions. Only SuperAdmin can change roles.'], 403);
    }
    if (!isset($labels[$role])) {
        json_response(['success' => false, 'error' => 'Invalid role.'], 422);
    }
}
if ($first_name === '' || $last_name === '' || $username === '' || $email === '') {
    json_response(['success' => false, 'error' => 'First name, last name, username, and email are required.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'error' => 'Invalid email address.'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT u.first_name, u.last_name, u.username, u.email, u.role, a.admin_level FROM users u LEFT JOIN admin a ON a.user_id = u.id WHERE u.id = ? AND u.deleted = 0');
    $stmt->execute([$id]);
    $original = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$original) {
        json_response(['success' => false, 'error' => 'User not found'], 404);
    }

    $old_role = $original['role'] === 'admin' ? 'admin-' . ((int) $original['admin_level'] === 2 ? 2 : 1) : 'user';
    $role_changes = $role !== null && $role !== $old_role;
    if ($role_changes && $id === $admin['id']) {
        json_response(['success' => false, 'error' => 'You cannot change the role of your own account.'], 422);
    }

    // Email and username must not belong to somebody else
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
    $stmt->execute([$email, $id]);
    if ($stmt->fetch()) {
        json_response(['success' => false, 'error' => 'That email is already used by another account.'], 422);
    }
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? AND id <> ?');
    $stmt->execute([$username, $id]);
    if ($stmt->fetch()) {
        json_response(['success' => false, 'error' => 'That username is already taken.'], 422);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ? WHERE id = ?');
    $stmt->execute([$first_name, $last_name, $username, $email, $id]);

    if ($role_changes) {
        $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
        $stmt->execute([$role === 'user' ? 'user' : 'admin', $id]);
        if ($role === 'user') {
            $stmt = $pdo->prepare('DELETE FROM admin WHERE user_id = ?');
            $stmt->execute([$id]);
        } else {
            $level = $role === 'admin-2' ? 2 : 1;
            $stmt = $pdo->prepare('SELECT user_id FROM admin WHERE user_id = ?');
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $stmt = $pdo->prepare('UPDATE admin SET admin_level = ? WHERE user_id = ?');
                $stmt->execute([$level, $id]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO admin (user_id, admin_level) VALUES (?, ?)');
                $stmt->execute([$id, $level]);
            }
        }
    }
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('edit-user.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to update user'], 500);
}

// Editing your own account: keep the session name in step
if ($id === $admin['id']) {
    $_SESSION['username'] = $username;
}

// Log what changed (same wording as before; roles now use their readable names)
$changes = [];
if ($original['first_name'] !== $first_name) {
    $changes[] = "First name changed from '{$original['first_name']}' to '{$first_name}'";
}
if ($original['last_name'] !== $last_name) {
    $changes[] = "Last name changed from '{$original['last_name']}' to '{$last_name}'";
}
if ($original['username'] !== $username) {
    $changes[] = "Username changed from '{$original['username']}' to '{$username}'";
}
if ($original['email'] !== $email) {
    $changes[] = "Email changed from '{$original['email']}' to '{$email}'";
}
if ($role_changes) {
    $changes[] = "Role changed from '{$labels[$old_role]}' to '{$labels[$role]}'";
}
$details = !empty($changes) ? implode('; ', $changes) : "No changes made to user: {$username}";
log_action($pdo, $id === $admin['id'] ? $username : $admin['username'], 'Edit User', $details);

json_response(['success' => true, 'message' => 'User updated successfully']);
