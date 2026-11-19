<?php
// Records a payment and creates the order. React's checkout page sends its form here.
// Everything is saved in ONE transaction: either the payment, the order and its items are all
// saved (and the stock is reduced), or nothing is.
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/json.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    json_response(['success' => false, 'error' => 'Please log in to complete your payment.'], 401);
}

// A file bigger than PHP's post_max_size makes PHP throw away the whole form ($_POST is empty)
if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    json_response(['success' => false, 'error' => 'Invalid file type or size. Use PNG, JPG, or GIF under 10MB.'], 413);
}

$amount = $_POST['amount'] ?? '';
$mobile = $_POST['mobile'] ?? '';
$reference = $_POST['reference'] ?? '';
$service = $_POST['service'] ?? '';
$from_cart = ($_POST['from_cart'] ?? '') === '1';

if (!preg_match('/^\d{1,10}(\.\d{1,2})?$/', $amount)) {
    json_response(['success' => false, 'error' => 'Invalid amount format. Up to 10 digits with 2 decimals allowed.'], 422);
}
if (!preg_match('/^\d{11}$/', $mobile)) {
    json_response(['success' => false, 'error' => 'Mobile number must be exactly 11 digits.'], 422);
}

// What is being bought: a list of [product_id, qty]
$lines = [];
if ($from_cart) {
    // Checkout from the cart: read the cart from the database (never trust the browser for this)
    $stmt = $pdo->prepare(
        'SELECT c.product_id, c.quantity
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ? AND p.deleted = 0'
    );
    $stmt->execute([$user_id]);
    foreach ($stmt->fetchAll() as $row) {
        $lines[] = ['product_id' => (int) $row['product_id'], 'qty' => max(1, (int) $row['quantity'])];
    }
    if (empty($lines)) {
        json_response(['success' => false, 'error' => 'No items in cart to checkout.'], 422);
    }
} else {
    // "Buy Now" and custom orders: the page sends product_id[] (and optionally quantity[])
    $product_ids = $_POST['product_id'] ?? [];
    if (!is_array($product_ids)) {
        $product_ids = [$product_ids];
    }
    $quantities = $_POST['quantity'] ?? [];
    foreach ($product_ids as $index => $pid) {
        $qty = 1;
        if (is_array($quantities) && isset($quantities[$index]) && is_numeric($quantities[$index])) {
            $qty = max(1, intval($quantities[$index]));
        }
        if ((int) $pid > 0) {
            $lines[] = ['product_id' => (int) $pid, 'qty' => $qty];
        }
    }
    if (empty($lines)) {
        json_response(['success' => false, 'error' => 'No product selected for order.'], 422);
    }
}

// The payment screenshot
$file = $_FILES['payment_screenshot'] ?? null;
if ($file && in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
    json_response(['success' => false, 'error' => 'Invalid file type or size. Use PNG, JPG, or GIF under 10MB.'], 422);
}
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    json_response(['success' => false, 'error' => 'Please upload a payment screenshot.'], 422);
}
$allowed_types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif'];
$image_info = @getimagesize($file['tmp_name']); // looks at the real file, not the name the browser sent
if ($file['size'] > 10 * 1024 * 1024 || !$image_info || !isset($allowed_types[$image_info[2]])) {
    json_response(['success' => false, 'error' => 'Invalid file type or size. Use PNG, JPG, or GIF under 10MB.'], 422);
}

$target_dir = __DIR__ . '/../../uploads/payments/';
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}
$new_filename = uniqid('payment_', true) . '.' . $allowed_types[$image_info[2]];
$target_path = $target_dir . $new_filename;
if (!move_uploaded_file($file['tmp_name'], $target_path)) {
    json_response(['success' => false, 'error' => 'Failed to save uploaded file.'], 500);
}

try {
    $pdo->beginTransaction();

    // How many of each product are wanted. The rows are locked while we check the stock,
    // so two buyers cannot take the last item at the same time.
    $needed = [];
    foreach ($lines as $line) {
        $needed[$line['product_id']] = ($needed[$line['product_id']] ?? 0) + $line['qty'];
    }
    $product_stmt = $pdo->prepare('SELECT id, name, price, stock, type FROM products WHERE id = ? AND deleted = 0 FOR UPDATE');
    $products = [];
    foreach ($needed as $pid => $qty) {
        $product_stmt->execute([$pid]);
        $product = $product_stmt->fetch();
        if (!$product) {
            throw new RuntimeException('One of the products is no longer available.');
        }
        if ((int) $product['stock'] < $qty) {
            throw new RuntimeException('Not enough stock for ' . $product['name'] . '. Only ' . (int) $product['stock'] . ' left.');
        }
        $products[$pid] = $product;
    }

    $stmt = $pdo->prepare('INSERT INTO payments (reference_number, service, image, mobile, amount, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$reference, $service, $new_filename, $mobile, $amount]);
    $payment_id = $pdo->lastInsertId();

    // Paying for a custom order: the admin's "Add Custom Order" already made an unpaid order
    // for this customer. Fill in that order instead of making a second one.
    $existing_order_id = null;
    if (!$from_cart && count($lines) === 1 && $products[$lines[0]['product_id']]['type'] === 'custom') {
        $stmt = $pdo->prepare(
            'SELECT o.id FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE oi.product_id = ? AND o.user_id = ? AND o.payment_id IS NULL AND o.deleted = 0
             ORDER BY o.id LIMIT 1 FOR UPDATE'
        );
        $stmt->execute([$lines[0]['product_id'], $user_id]);
        $existing_order_id = $stmt->fetchColumn() ?: null;
    }

    $stock_stmt = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    if ($existing_order_id) {
        $pdo->prepare('UPDATE orders SET payment_id = ? WHERE id = ?')->execute([$payment_id, $existing_order_id]);
        $order_id = $existing_order_id;
        $stock_stmt->execute([$lines[0]['qty'], $lines[0]['product_id']]); // its order item is already there
    } else {
        $stmt = $pdo->prepare("INSERT INTO orders (payment_id, user_id, status) VALUES (?, ?, 'pending')");
        $stmt->execute([$payment_id, $user_id]);
        $order_id = $pdo->lastInsertId();

        $item_stmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)');
        foreach ($lines as $line) {
            $item_stmt->execute([$order_id, $line['product_id'], $line['qty'], $products[$line['product_id']]['price']]);
            $stock_stmt->execute([$line['qty'], $line['product_id']]);
        }
    }

    if ($from_cart) {
        $stmt = $pdo->prepare('DELETE FROM cart WHERE user_id = ?');
        $stmt->execute([$user_id]);
    }

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    @unlink($target_path);
    error_log('payment.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
} catch (RuntimeException $e) {
    $pdo->rollBack();
    @unlink($target_path);
    json_response(['success' => false, 'error' => $e->getMessage()], 409);
}

json_response([
    'success'   => true,
    'order_id'  => (int) $order_id,
    'amount'    => $amount,
    'mobile'    => $mobile,
    'reference' => $reference,
]);
