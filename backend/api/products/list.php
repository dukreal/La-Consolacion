<?php
// Lists the products shown in the Shop (React calls this instead of PHP looping over them).
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

// Same rule as the old shop.php: only logged-in users can see the shop.
if (!isset($_SESSION['user_id'])) {
    json_response(['success' => false, 'error' => 'User not logged in'], 401);
}

try {
    // Premade products only (custom orders are not sold here), newest first
    $stmt = $pdo->prepare("SELECT id, name, type, price, stock, image, description FROM products WHERE deleted = 0 AND type != 'custom' ORDER BY id DESC");
    $stmt->execute();

    // Send real numbers (PHP would otherwise send "1500.00" as text)
    $products = array_map(function ($p) {
        return [
            'id'          => (int) $p['id'],
            'name'        => $p['name'],
            'type'        => $p['type'],
            'price'       => (float) $p['price'],
            'stock'       => (int) $p['stock'],
            'image'       => $p['image'],
            'description' => $p['description'] ?? '',
        ];
    }, $stmt->fetchAll());

    json_response(['success' => true, 'products' => $products]);
} catch (PDOException $e) {
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}
