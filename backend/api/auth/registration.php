<?php
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'errors' => ['Method not allowed.']], 405);
}

$input = read_json();
$first_name = trim($input['first_name'] ?? '');
$last_name = trim($input['last_name'] ?? '');
$username = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirm = $input['confirm_password'] ?? '';

$errors = [];
if (empty($first_name)) {
    $errors[] = 'First name is required.';
}
if (empty($last_name)) {
    $errors[] = 'Last name is required.';
}
if (!preg_match('/^[a-zA-Z0-9._%+-]+@gmail\.com$/', $email)) {
    $errors[] = 'Only Gmail accounts are allowed.';
}
if ($password !== $confirm) {
    $errors[] = 'Passwords do not match.';
}
if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters.';
}

// Check if email already exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    $errors[] = 'Email already registered.';
}

if (count($errors) > 0) {
    json_response(['success' => false, 'errors' => $errors], 422);
}
// The register form has no username field, but the database needs a unique one.
// Use the part of the email before "@" (ana.cruz@gmail.com -> ana.cruz) and add a number if it is taken.
if ($username === '') {
    $base = strstr($email, '@', true);
    $username = $base;
    $suffix = 1;
    $check = $pdo->prepare('SELECT 1 FROM users WHERE username = ?');
    while (true) {
        $check->execute([$username]);
        $taken = $check->fetchColumn();
        $check->closeCursor();
        if (!$taken) {
            break;
        }
        $username = $base . ++$suffix; // ana.cruz2, ana.cruz3, ...
    }
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$role = 'user';
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+1 day'));

try {
    $stmt = $pdo->prepare('INSERT INTO users (first_name, last_name, username, email, password, role, is_verified, verification_token, token_expires_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)');
    $stmt->execute([$first_name, $last_name, $username, $email, $hash, $role, $token, $expires]);
} catch (PDOException $e) {
    json_response(['success' => false, 'errors' => ['Registration failed. Please try again.']], 500);
}

// Send verification email (the link opens the React page /verify-email)
$config = require __DIR__ . '/../../config/app.php';
$verification_link = $config['frontend_url'] . '/verify-email?token=' . $token;
$mail_sent = send_mail($email, 'Verify your account', "Click this link to verify your account: $verification_link");

// Log registration
$session_username = $_SESSION['username'] ?? null;
$session_role = $_SESSION['role'] ?? null;
if ($session_username && $session_role === 'admin') {
    log_action($pdo, $session_username, 'Admin Create User', "Admin created new user: $username ($email)");
} else {
    log_action($pdo, $username, 'Register User', "Registered new user: $username ($email)");
}

if (!$mail_sent) {
    // The account exists, but the email could not be sent.
    json_response([
        'success' => false,
        'accountCreated' => true,
        'errors' => ['Warning: Verification email could not be sent. Please contact support or try again later.'],
    ]);
}

json_response(['success' => true, 'message' => 'Registration successful! Please check your email to verify your account.']);