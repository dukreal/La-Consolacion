<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/mailer.php';

date_default_timezone_set('Asia/Manila');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = read_json();
$email = $input['email'] ?? '';

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    $stmt = $pdo->prepare('UPDATE users SET password_reset_token = ?, token_expiry = ? WHERE email = ?');
    $stmt->execute([$token, $expiry, $email]);

    // The link opens the React page /reset-password
    $config = require __DIR__ . '/../../config/app.php';
    $reset_link = $config['frontend_url'] . '/reset-password?token=' . $token;
    send_mail($email, 'Password Reset', "Click this link to reset your password: $reset_link");
}

// Same answer whether or not the email exists (so nobody can probe for accounts).
json_response(['success' => true, 'message' => 'If this email exists in our system, a reset link will be sent.']);