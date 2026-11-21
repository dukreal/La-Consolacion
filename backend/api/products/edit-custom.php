<?php
// The admin "Edit Custom Order" page. Any admin can use it (same as before).
//   GET  ?id=N  → the custom product and its custom order
//   POST form   → saves it: customerName, customerEmail, customerPhone (optional), productName, customPrice, stock,
//                 customStatus, customDescription, customImage (file, optional)
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../helpers/product-form.php';

$admin = require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    reject_oversized_post();
}
$id = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);

try {
    $stmt = $pdo->prepare(
        "SELECT p.name, p.price, p.stock, p.image, c.customer_name, c.email, c.phone, c.description, c.status
         FROM products p
         JOIN custom_orders c ON c.id = p.id
         WHERE p.id = ? AND p.type = 'custom' AND p.deleted = 0"
    );
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('edit-custom.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}
if (!$order) {
    json_response(['success' => false, 'error' => 'Custom order not found'], 404);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        'success' => true,
        'order'   => [
            'id'           => $id,
            'customerName' => $order['customer_name'],
            'email'        => $order['email'],
            'phone'        => $order['phone'] ?? '',
            'productName'  => $order['name'],
            'price'        => (float) $order['price'],
            'stock'        => (int) $order['stock'],
            'status'       => $order['status'] ?? 'pending',
            'description'  => $order['description'] ?? '',
            'image'        => $order['image'],
        ],
    ]);
}

$c = read_custom_fields();
$status = $_POST['customStatus'] ?? '';
if (!in_array($status, CUSTOM_STATUSES, true)) {
    json_response(['success' => false, 'error' => 'Please select a status.'], 422);
}
// No new picture = keep the current one
$image = $order['image'];
if (has_upload('customImage')) {
    $image = save_product_image('customImage', 'custom', 'custom_' . slug($c['customer_name']));
}

try {
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE products SET name = ?, price = ?, stock = ?, description = ?, image = ? WHERE id = ?')
        ->execute([$c['product_name'], $c['price'], $c['stock'], $c['description'], $image, $id]);
    $pdo->prepare('UPDATE custom_orders SET customer_name = ?, email = ?, phone = ?, description = ?, status = ? WHERE id = ?')
        ->execute([$c['customer_name'], $c['email'], $c['phone'], $c['description'], $status, $id]);
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('edit-custom.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to update custom order details.'], 500);
}

log_action($pdo, $admin['username'], 'Edit Custom Order', "Updated custom order for: {$c['customer_name']} | Description: {$c['description']}");

json_response(['success' => true]);
