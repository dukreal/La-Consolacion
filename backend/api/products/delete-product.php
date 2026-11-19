<?php
// Soft-deletes a product from the admin Inventory page. SuperAdmin only.
// A custom product's custom_orders row (same id) is soft-deleted too, like before.
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin(2);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$id = (int) ($_POST['id'] ?? 0);
if (!$id) {
    json_response(['success' => false, 'error' => 'No product ID provided'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ? AND deleted = 0');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_response(['success' => false, 'error' => 'Product not found'], 404);
    }

    $pdo->beginTransaction();
    $pdo->prepare('UPDATE products SET deleted = 1 WHERE id = ?')->execute([$id]);
    $pdo->prepare('UPDATE custom_orders SET deleted = 1 WHERE id = ?')->execute([$id]);
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('delete-product.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to delete product'], 500);
}

log_action($pdo, $admin['username'], 'Delete Product', "Soft deleted product ID: {$id}");

json_response(['success' => true]);
