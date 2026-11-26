<?php
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/login-limit.php'; // 5 wrong passwords: wait 15 minutes

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$input = read_json();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

try {
    // Locked after too many wrong passwords: the password is not checked at all until the time is up
    $locked = login_locked_minutes($pdo, $email);
    if ($locked) {
        login_locked_response($locked);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // A deleted account answers like a wrong password, so nobody learns that it exists
    if (!$user || (int) $user['deleted'] === 1 || !password_verify($password, $user['password'])) {
        $locked = login_failed($pdo, $email);
        if ($locked) {
            login_locked_response($locked); // this was the last wrong try allowed
        }
        json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
    }
    login_succeeded($pdo, $email); // the right password: forget the wrong tries

    // The email must be verified before the first login (the link sent when registering).
    // Checked after the password, so only the owner of the account sees this message.
    if ((int) $user['is_verified'] !== 1) {
        json_response([
            'success' => false,
            'needsVerification' => true,
            'error' => 'Please verify your email first. We sent a link to your Gmail when you registered.',
        ], 403);
    }

    // A new session ID for the logged-in user, so an ID someone else knew from before the login is
    // worthless (it stays logged out)
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];

    // If admin, fetch admin level
    if ($user['role'] === 'admin') {
        $admin_stmt = $pdo->prepare('SELECT admin_level FROM admin WHERE user_id = ?');
        $admin_stmt->execute([$user['id']]);
        $admin_data = $admin_stmt->fetch();
        $_SESSION['admin_level'] = $admin_data['admin_level'] ?? null;
    }

    // React uses "role" to decide where to send the user (admin dashboard or home).
    json_response(['success' => true, 'role' => $user['role']]);
} catch (PDOException $e) {
    error_log('login.php database error: ' . $e->getMessage()); // details for the server log only
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}