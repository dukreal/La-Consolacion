<?php
// The logged-in user's profile, for the Profile page and to fill in the delivery address at checkout.
// address: the delivery address saved for next time (helpers/delivery.php), or null.
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/delivery.php';

if (!isset($_SESSION['user_id'])) {
    json_response(['success' => false, 'error' => 'User not logged in'], 401);
}

$stmt = $pdo->prepare(
    'SELECT first_name, last_name, username, email, mobile_number, profile_image
     FROM users WHERE id = ? AND deleted = 0'
);
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['success' => false, 'error' => 'User not found.'], 404);
}

json_response([
    'success' => true,
    'user' => [
        'firstName'    => $user['first_name'],
        'lastName'     => $user['last_name'],
        'username'     => $user['username'],
        'email'        => $user['email'],
        'mobileNumber' => $user['mobile_number'] ?? '',
        'profileImage' => $user['profile_image'],
        'address'      => saved_address($pdo, (int) $_SESSION['user_id']),
    ],
]);
