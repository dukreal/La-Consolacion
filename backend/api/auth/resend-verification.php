<?php
// "Resend verification email" on the Login page (shown when an unverified account tries to log in).
// Needs the same email and password as the login, so it cannot be used to send emails to other
// people or to find out which emails have an account. One email per minute per account.
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$input = read_json();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

$stmt = $pdo->prepare('SELECT id, username, password, deleted, is_verified, token_expires_at FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || (int) $user['deleted'] === 1 || !password_verify($password, $user['password'])) {
    json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
}

if ((int) $user['is_verified'] === 1) {
    json_response(['success' => true, 'alreadyVerified' => true, 'message' => 'Your email is already verified. You can log in.']);
}

// A link lasts one day, so it was made one day before it expires: allow a new one after a minute
if (!empty($user['token_expires_at'])) {
    $made_at = strtotime($user['token_expires_at']) - 86400;
    if (time() - $made_at < 60) {
        json_response(['success' => false, 'error' => 'Please wait a minute before asking for another email.'], 429);
    }
}

$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+1 day'));
$stmt = $pdo->prepare('UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?');
$stmt->execute([$token, $expires, $user['id']]);

// Same email as registration.php (the link opens the React page /verify-email)
$config = require __DIR__ . '/../../config/app.php';
$verification_link = $config['frontend_url'] . '/verify-email?token=' . $token;
$sent = send_mail($email, 'Verify your account', "Click this link to verify your account: $verification_link");

if (!$sent) {
    json_response(['success' => false, 'error' => "We couldn't send the email right now. Please try again in a few minutes."], 502);
}

log_action($pdo, $user['username'], 'Resend Verification', "Verification email sent again to $email");
json_response(['success' => true, 'message' => 'A new verification link has been sent to your Gmail. Check your inbox (and Spam).']);
