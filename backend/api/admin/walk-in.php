<?php
// The admin "Walk-In Order" page (point of sale for the physical store). Was admin-walkin.php.
//   GET  → products that can be sold (in stock, not custom), A to Z
//   POST → records a sale: product_id, quantity, payment_method (CASH, GCASH, PAYMAYA, GOTYME),
//          reference_number (needed for e-wallets)
// A sale is saved as a completed order for the "walkin_guest" account, with a payment row,
// and the stock goes down at once. All of it in one transaction.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/payments.php'; // STORE_PAYMENT_METHODS

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    try {
        $products = $pdo->query(
            "SELECT id, name, price, stock FROM products WHERE deleted = 0 AND stock > 0 AND type != 'custom' ORDER BY name ASC"
        )->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('walk-in.php database error: ' . $e->getMessage());
        json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
    }
    json_response(['success' => true, 'products' => array_map(fn ($p) => [
        'id'    => (int) $p['id'],
        'name'  => $p['name'],
        'price' => (float) $p['price'],
        'stock' => (int) $p['stock'],
    ], $products)]);
}


$product_id = (int) ($_POST['product_id'] ?? 0);
$quantity_text = trim($_POST['quantity'] ?? '');
$method = $_POST['payment_method'] ?? '';
$reference = trim($_POST['reference_number'] ?? '');

if (!$product_id) {
    json_response(['success' => false, 'error' => 'Please select an item.'], 422);
}
// A quantity of 0 or less would have added stock on the old page
if (!preg_match('/^\d+$/', $quantity_text) || (int) $quantity_text < 1) {
    json_response(['success' => false, 'error' => 'Quantity must be at least 1.'], 422);
}
$quantity = (int) $quantity_text;
if (!isset(STORE_PAYMENT_METHODS[$method])) {
    json_response(['success' => false, 'error' => 'Please choose a payment method.'], 422);
}
if ($method !== 'CASH' && $reference === '') {
    json_response(['success' => false, 'error' => 'Please enter the InstaPay reference number.'], 422);
}
if ($method === 'CASH') {
    $reference = 'CASH-' . time();
}

try {
    $pdo->beginTransaction();

    // FOR UPDATE locks the row so two sales at once cannot both take the last piece
    $stmt = $pdo->prepare("SELECT name, price, stock FROM products WHERE id = ? AND deleted = 0 AND type != 'custom' FOR UPDATE");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$product || (int) $product['stock'] < $quantity) {
        $pdo->rollBack();
        json_response(['success' => false, 'error' => 'Insufficient stock available!'], 422);
    }
    $total = $product['price'] * $quantity;

    // The old page used user id 2 and said "set this to your Walk-in Customer user".
    // Now the walk-in account is found by its username, and made the first time it is needed.
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'walkin_guest' LIMIT 1");
    $stmt->execute();
    $walkin_id = $stmt->fetchColumn();
    if (!$walkin_id) {
        $pdo->prepare(
            "INSERT INTO users (first_name, last_name, username, email, password, role, is_verified, deleted)
             VALUES ('Walk-in', 'Customer', 'walkin_guest', 'walkin@lcj.local', '', 'guest', 1, 0)"
        )->execute();
        $walkin_id = (int) $pdo->lastInsertId();
    }

    $payment = STORE_PAYMENT_METHODS[$method];
    $stmt = $pdo->prepare("INSERT INTO payments (reference_number, service, image, mobile, amount) VALUES (?, ?, ?, 'Walk-in', ?)");
    $stmt->execute([$reference, $payment['service'], $payment['image'], $total]);
    $payment_id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare("INSERT INTO orders (user_id, payment_id, status, date_completed) VALUES (?, ?, 'completed', NOW())");
    $stmt->execute([$walkin_id, $payment_id]);
    $order_id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)');
    $stmt->execute([$order_id, $product_id, $quantity, $product['price']]);

    $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([$quantity, $product_id]);

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('walk-in.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

json_response(['success' => true, 'orderId' => $order_id]);
