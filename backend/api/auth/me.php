<?php
// Returns the logged-in user as JSON. React's AuthContext calls this on page load.
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['loggedIn' => false]);
    exit();
}

require_once __DIR__ . '/../../config/db.php';

$stmt = $pdo->prepare(
    'SELECT u.id, u.username, u.email, u.first_name, u.profile_image, u.role, a.admin_level
     FROM users u
     LEFT JOIN admin a ON u.id = a.user_id
     WHERE u.id = ? AND u.deleted = 0'
);
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

// Deleted or missing account: treat as logged out
if (!$user) {
    session_destroy();
    echo json_encode(['loggedIn' => false]);
    exit();
}

echo json_encode([
    'loggedIn' => true,
    'user' => [
        'id'           => (int) $user['id'],
        'username'     => $user['username'],
        'email'        => $user['email'],
        'firstName'    => $user['first_name'],
        'profileImage' => $user['profile_image'],
        'role'         => $user['role'],
        'adminLevel'   => $user['admin_level'],
    ],
]);