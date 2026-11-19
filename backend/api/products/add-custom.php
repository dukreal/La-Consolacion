<?php
// Adds a custom order from the admin "Add Custom Order" form. SuperAdmin only
// (only SuperAdmins see the Add Custom button; the old page did not check this on the server).
// POST form: customerName, customerEmail, productName, customPrice, stock, customDescription, customImage (file, optional)
//
// Same steps as before, all in one transaction:
//   1. a products row (type 'custom') and a custom_orders row with the same id
//   2. the customer's account is found by email, or a guest account is made
//   3. a pending order with one order item
// Then the customer gets an email with the payment link, and the admin gets a copy.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../helpers/product-form.php';
require_once __DIR__ . '/../../helpers/mailer.php';

$admin = require_admin(2);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}
reject_oversized_post();

$c = read_custom_fields();
$image = '';
if (has_upload('customImage')) {
    // Same file name style as before: custom_<customer>_<random>.jpg
    $image = save_product_image('customImage', 'custom', 'custom_' . slug($c['customer_name']));
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO products (name, price, stock, type, material, description, image, deleted) VALUES (?, ?, ?, 'custom', NULL, ?, ?, 0)");
    $stmt->execute([$c['product_name'], $c['price'], $c['stock'], $c['description'], $image]);
    $product_id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare("INSERT INTO custom_orders (id, customer_name, email, description, status, created_at, deleted) VALUES (?, ?, ?, ?, 'pending', NOW(), 0)");
    $stmt->execute([$product_id, $c['customer_name'], $c['email'], $c['description']]);

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$c['email']]);
    $user_id = $stmt->fetchColumn();
    if (!$user_id) {
        // Guest account with no password (nobody can log in to it). The old code left out
        // first_name, last_name and password, which the database requires, so this step always failed.
        $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, username, email, password, role, deleted) VALUES (?, '', ?, ?, '', 'guest', 0)");
        $stmt->execute([$c['customer_name'], 'guest_' . uniqid(), $c['email']]);
        $user_id = (int) $pdo->lastInsertId();
    }

    // The order has no payment yet; that is added when the customer pays
    $stmt = $pdo->prepare("INSERT INTO orders (user_id, payment_id, status, date_ordered, deleted) VALUES (?, NULL, 'pending', NOW(), 0)");
    $stmt->execute([$user_id]);
    $order_id = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)');
    $stmt->execute([$order_id, $product_id, $c['price']]);

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('add-custom.php database error: ' . $e->getMessage());
    if ($image) {
        @unlink(__DIR__ . '/../../uploads/custom/' . $image); // do not keep a picture for an order that was not saved
    }
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

log_action($pdo, $admin['username'], 'Add Custom Order', "Added custom order for: {$c['customer_name']} | Description: {$c['description']}");

// Emails (same text as before). The link now opens the React payment page for this custom order.
$config = require __DIR__ . '/../../config/app.php';
$price = number_format($c['price'], 2);
$link = $config['frontend_url'] . '/custom-order/' . $product_id . '/payment';

$customer_sent = send_mail(
    $c['email'],
    'Your Custom Order at La Consolacion Jewelry',
    "Hello {$c['customer_name']},\n\nThank you for your custom order!\n\nOrder Details:\nDescription: {$c['description']}\nPrice: ₱$price\n\n"
        . "To complete your order, please proceed to payment using the link below:\n$link\n\nThank you!",
    '/send-order-notification'
);

send_mail(
    $config['admin_email'],
    'New Custom Order Received - La Consolacion Jewelry',
    "A new custom order has been received!\n\nCustomer Details:\nName: {$c['customer_name']}\nEmail: {$c['email']}\n\n"
        . "Order Details:\nProduct Name: {$c['product_name']}\nDescription: {$c['description']}\nPrice: ₱$price\nStock: {$c['stock']}\n\n"
        . "Order ID: $product_id\n\nView order details in admin panel.",
    '/send-order-notification'
);

json_response([
    'success'   => true,
    'id'        => $product_id,
    'email'     => $c['email'],
    'emailSent' => $customer_sent, // false = saved, but the mailer could not send the email
]);
