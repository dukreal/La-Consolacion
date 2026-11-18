<?php
// Saves the Profile page (text fields and an optional new profile photo).
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'errors' => ['Method not allowed.']], 405);
}
if (!isset($_SESSION['user_id'])) {
    json_response(['success' => false, 'errors' => ['User not logged in']], 401);
}
$user_id = $_SESSION['user_id'];

// A photo bigger than PHP's post_max_size makes PHP throw away the whole form ($_POST is empty)
if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    json_response(['success' => false, 'errors' => ['The image is too large.']], 413);
}

$stmt = $pdo->prepare('SELECT profile_image FROM users WHERE id = ? AND deleted = 0');
$stmt->execute([$user_id]);
$current = $stmt->fetch();
if (!$current) {
    json_response(['success' => false, 'errors' => ['User not found.']], 404);
}

$first_name = trim($_POST['first_name'] ?? '');
$last_name = trim($_POST['last_name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$mobile_number = trim($_POST['mobile_number'] ?? '');
$profile_image = $current['profile_image'];

$errors = [];
if ($first_name === '' || $last_name === '' || $username === '' || $email === '') {
    $errors[] = 'First name, last name, username, and email are required.';
}
if ($mobile_number !== '' && !preg_match('/^\d{11}$/', $mobile_number)) {
    $errors[] = 'Mobile number must be exactly 11 digits.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email address.';
}

// Email and username must not belong to somebody else
if (empty($errors)) {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
    $stmt->execute([$email, $user_id]);
    if ($stmt->fetch()) {
        $errors[] = 'That email is already used by another account.';
    }
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? AND id <> ?');
    $stmt->execute([$username, $user_id]);
    if ($stmt->fetch()) {
        $errors[] = 'That username is already taken.';
    }
}

// New profile photo (only handled when everything above is fine, so nothing is saved or deleted by a failed form)
$new_image_path = null;
if (empty($errors) && isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $ext = strtolower(pathinfo(basename($_FILES['profile_image']['name']), PATHINFO_EXTENSION));
    $image_info = @getimagesize($_FILES['profile_image']['tmp_name']); // is it really a picture?
    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true) && $image_info) {
        $target_dir = __DIR__ . '/../../uploads/profile/';
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $new_name = 'profile_' . $user_id . '_' . uniqid() . '.' . $ext;
        if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target_dir . $new_name)) {
            $new_image_path = $target_dir . $new_name;
            $profile_image = $new_name;
        } else {
            $errors[] = 'Image upload failed.';
        }
    } else {
        $errors[] = 'Invalid image type.';
    }
}

if (!empty($errors)) {
    json_response(['success' => false, 'errors' => $errors], 422);
}

try {
    $stmt = $pdo->prepare('UPDATE users SET profile_image=?, first_name=?, last_name=?, username=?, email=?, mobile_number=? WHERE id=?');
    $stmt->execute([$profile_image, $first_name, $last_name, $username, $email, $mobile_number, $user_id]);
} catch (PDOException $e) {
    if ($new_image_path) {
        @unlink($new_image_path);
    }
    error_log('update-profile.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'errors' => ['Failed to update profile.']], 500);
}

// The old photo is deleted only after the update worked
if ($new_image_path && !empty($current['profile_image'])) {
    @unlink(__DIR__ . '/../../uploads/profile/' . $current['profile_image']);
}

$_SESSION['username'] = $username;
$_SESSION['email'] = $email;

json_response([
    'success' => true,
    'message' => 'Your profile has been updated successfully.',
    'user' => [
        'firstName'    => $first_name,
        'lastName'     => $last_name,
        'username'     => $username,
        'email'        => $email,
        'mobileNumber' => $mobile_number,
        'profileImage' => $profile_image,
    ],
]);
