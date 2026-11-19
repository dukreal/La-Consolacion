<?php
// Adds a premade product from the admin "Add New Premade Product" form. SuperAdmin only
// (only SuperAdmins see the Add Premade button; the old page did not check this on the server).
// POST form: itemName, itemPrice, itemStock, itemType, itemMaterial, itemDescription, itemImage (file)
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../helpers/product-form.php';

$admin = require_admin(2);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}
reject_oversized_post();

$p = read_premade_fields();
if (!has_upload('itemImage')) {
    json_response(['success' => false, 'error' => 'Image is required.'], 422);
}
// Same file name style as before: prod_<name>_<type>_<random>.jpg
$image = save_product_image('itemImage', 'products', 'prod_' . slug($p['name']) . '_' . $p['type']);

try {
    $stmt = $pdo->prepare('INSERT INTO products (image, name, price, stock, type, material, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$image, $p['name'], $p['price'], $p['stock'], $p['type'], $p['material'], $p['description']]);
    $id = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    error_log('add-product.php database error: ' . $e->getMessage());
    @unlink(__DIR__ . '/../../uploads/products/' . $image); // do not keep a picture for a product that was not saved
    json_response(['success' => false, 'error' => 'Add failed.'], 500);
}

log_action($pdo, $admin['username'], 'Add Product', "Added product: {$p['name']} | Description: {$p['description']}");

json_response(['success' => true, 'id' => $id]);
