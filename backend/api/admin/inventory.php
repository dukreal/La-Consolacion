<?php
// All products (premade and custom) for the admin Inventory page
// (was the PHP at the top of admin-inventory.php). Newest first, deleted ones left out.
require_once __DIR__ . '/../../helpers/admin.php';

$admin = require_admin();

try {
    $products = $pdo->query(
        'SELECT id, name, price, stock, type, image FROM products WHERE deleted = 0 ORDER BY created_at DESC, id DESC'
    )->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('inventory.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

json_response([
    'success'    => true,
    'adminLevel' => $admin['admin_level'], // 2 = SuperAdmin: sees Add and Delete buttons
    'products'   => array_map(function ($p) {
        return [
            'id'    => (int) $p['id'],
            'name'  => $p['name'],
            'price' => (float) $p['price'],
            'stock' => (int) $p['stock'],
            'type'  => $p['type'],
            'image' => $p['image'],
        ];
    }, $products),
]);
