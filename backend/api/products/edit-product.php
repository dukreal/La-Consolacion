<?php
// The admin "Edit Product" page for premade products.
//   GET  ?id=N  → the product, and the admin level (Admin can only change stock)
//   POST form   → saves it. SuperAdmin: all fields + optional new itemImage. Admin: itemStock only.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../helpers/product-form.php';

$admin = require_admin();
$is_super = $admin['admin_level'] >= 2;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    reject_oversized_post();
}
$id = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);

try {
    // Custom products have their own edit page (edit-custom.php)
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND deleted = 0 AND type != 'custom'");
    $stmt->execute([$id]);
    $original = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('edit-product.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}
if (!$original) {
    json_response(['success' => false, 'error' => 'Product not found'], 404);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        'success'    => true,
        'adminLevel' => $admin['admin_level'],
        'product'    => [
            'id'          => (int) $original['id'],
            'name'        => $original['name'],
            'price'       => (float) $original['price'],
            'stock'       => (int) $original['stock'],
            'type'        => $original['type'],
            'material'    => $original['material'] ?? '',
            'description' => $original['description'] ?? '',
            'image'       => $original['image'],
        ],
    ]);
}

$changes = [];
$stock = trim($_POST['itemStock'] ?? '');

if ($is_super) {
    $p = read_premade_fields();
    // No new picture = keep the current one (same as the old form's hidden currentImage field)
    $image = $original['image'];
    if (has_upload('itemImage')) {
        $image = save_product_image('itemImage', 'products', 'prod');
    }
    $sql = 'UPDATE products SET image = ?, name = ?, price = ?, stock = ?, type = ?, material = ?, description = ? WHERE id = ?';
    $params = [$image, $p['name'], $p['price'], $p['stock'], $p['type'], $p['material'], $p['description'], $id];

    // Same log wording as before
    if ($original['name'] !== $p['name']) {
        $changes[] = "Name changed from '{$original['name']}' to '{$p['name']}'";
    }
    if ((float) $original['price'] != $p['price']) {
        $changes[] = "Price changed from Php {$original['price']} to Php {$p['price']}";
    }
    if ((int) $original['stock'] !== $p['stock']) {
        $changes[] = "Stock changed from {$original['stock']} to {$p['stock']}";
    }
    if ($original['type'] !== $p['type']) {
        $changes[] = "Type changed from '{$original['type']}' to '{$p['type']}'";
    }
    if ((string) $original['material'] !== $p['material']) {
        $changes[] = "Material changed from '{$original['material']}' to '{$p['material']}'";
    }
    if ((string) $original['description'] !== $p['description']) {
        $changes[] = 'Description changed';
    }
    if ($original['image'] !== $image) {
        $changes[] = 'Image changed';
    }
} else {
    // Admin (level 1) can only change the stock; other fields sent are ignored
    check_stock($stock);
    $sql = 'UPDATE products SET stock = ? WHERE id = ?';
    $params = [(int) $stock, $id];
    if ((int) $original['stock'] !== (int) $stock) {
        $changes[] = "Stock changed from {$original['stock']} to {$stock}";
    }
}

try {
    $pdo->prepare($sql)->execute($params);
} catch (PDOException $e) {
    error_log('edit-product.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Update failed.'], 500);
}

$details = $changes ? implode('; ', $changes) : "Edited product: {$original['name']} (no changes)";
log_action($pdo, $admin['username'], 'Edit Product', $details);

json_response(['success' => true]);
