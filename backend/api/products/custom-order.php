<?php
// One custom order, for the preview page and the custom-order payment page.
// Public, like the old custom-preview.php (customers open it from a link in their email).
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    json_response(['success' => false, 'error' => 'No custom order ID provided.'], 400);
}

// Custom orders are stored in the products table (type = 'custom') plus a custom_orders row
$stmt = $pdo->prepare(
    "SELECT p.id, p.name, p.price, p.stock, p.image, c.customer_name, c.email, c.phone, c.description, c.status
     FROM products p
     JOIN custom_orders c ON c.id = p.id
     WHERE p.id = ? AND p.type = 'custom' AND p.deleted = 0 AND (c.deleted = 0 OR c.deleted IS NULL)"
);
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['success' => false, 'error' => 'Custom order not found.'], 404);
}

$price = (float) $row['price'];
json_response([
    'success' => true,
    'order' => [
        'id'           => (int) $row['id'],
        'name'         => $row['name'],
        'price'        => $price,
        'downpayment'  => round($price * 0.3, 2), // 30%, same rule as the old payment-form.php
        'stock'        => (int) $row['stock'],
        'image'        => $row['image'],
        'customerName' => $row['customer_name'],
        'email'        => $row['email'],
        'phone'        => $row['phone'] ?: null, // optional, typed on the Add/Edit Custom Order form
        'description'  => $row['description'] ?? '',
        'status'       => $row['status'] ?? 'pending',
    ],
]);
