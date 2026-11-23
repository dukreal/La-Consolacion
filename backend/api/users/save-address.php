<?php
// Saves the logged-in customer's delivery address for next time (Profile > Delivery Address).
// POST form: name, mobile, street, barangay, city, province, zip, notes (helpers/delivery.php).
// clear=1 removes the saved address. Answers { success, address } or { success: false, errors: [...] }.
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';
require_once __DIR__ . '/../../helpers/delivery.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'errors' => ['Method not allowed.']], 405);
}
if (!isset($_SESSION['user_id'])) {
    json_response(['success' => false, 'errors' => ['User not logged in']], 401);
}

if (($_POST['clear'] ?? '') === '1') {
    $address = array_fill_keys(array_keys(ADDRESS_FIELDS), null);
} else {
    [$address, $errors] = read_address($_POST);
    if ($errors) {
        json_response(['success' => false, 'errors' => $errors], 422);
    }
}

try {
    $set = implode(', ', array_map(fn ($c) => "$c = ?", address_columns('address_')));
    $pdo->prepare("UPDATE users SET $set WHERE id = ? AND deleted = 0")->execute([...array_values($address), $_SESSION['user_id']]);
} catch (PDOException $e) {
    error_log('save-address.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'errors' => ['Could not save the address. Please try again.']], 500);
}

json_response(['success' => true, 'address' => $address['street'] === null ? null : $address]);
