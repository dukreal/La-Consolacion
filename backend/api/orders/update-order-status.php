<?php
// Changes an order's status from the Details pop-up on the admin Orders page. Any admin can do it.
// POST form: order_id, new_status (pending, processing, waiting_for_buyer, completed, cancelled)
//            balance_method (CASH, GCASH, PAYMAYA, GOTYME) and balance_reference (e-wallets only):
//            needed for Completed when the customer still owes part of the price (the 70% after the downpayment);
//            that payment is saved as a second payments row (orders.balance_payment_id), in the same step.
//
// Completed and Cancelled are final: they also set date_completed, and after that the order is locked.
// The customer gets an email for every status except Pending.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/mailer.php';
require_once __DIR__ . '/../../helpers/payments.php';

$admin = require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

const ORDER_STATUSES = ['pending', 'processing', 'waiting_for_buyer', 'completed', 'cancelled'];
const FINAL_STATUSES = ['completed', 'cancelled'];

$order_id = (int) ($_POST['order_id'] ?? 0);
$new_status = $_POST['new_status'] ?? '';
if (!$order_id || !in_array($new_status, ORDER_STATUSES, true)) {
    json_response(['success' => false, 'error' => 'Invalid status'], 400);
}

try {
    $stmt = $pdo->prepare('SELECT o.status, o.payment_id, o.date_completed, u.email, u.first_name, u.username
                           FROM orders o JOIN users u ON o.user_id = u.id
                           WHERE o.id = ? AND o.deleted = 0');
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('update-order-status.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to update order status'], 500);
}
if (!$order) {
    json_response(['success' => false, 'error' => 'Order not found'], 404);
}
$old_status = strtolower($order['status']);

// The pop-up already blocks these; the server now checks them too
if ($order['payment_id'] === null) {
    json_response(['success' => false, 'error' => 'Payment is required before the status can change.'], 422);
}
if ($order['date_completed'] && in_array($old_status, FINAL_STATUSES, true)) {
    json_response(['success' => false, 'error' => 'This order is already completed and cannot be changed.'], 422);
}

try {
    $amounts = order_amounts($pdo, $order_id);
} catch (PDOException $e) {
    error_log('update-order-status.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to update order status'], 500);
}

// Completing an order that is not fully paid: the admin says how the balance was paid at the store
$balance_paid = null; // ['service' => ..., 'amount' => ...] when it is recorded now
if ($new_status === 'completed' && $amounts['balance'] > 0) {
    $method = $_POST['balance_method'] ?? '';
    $reference = trim($_POST['balance_reference'] ?? '');
    if (!isset(STORE_PAYMENT_METHODS[$method])) {
        json_response(['success' => false, 'error' => 'Please choose how the balance of ' . peso_text($amounts['balance']) . ' was paid.'], 422);
    }
    if ($method !== 'CASH' && $reference === '') {
        json_response(['success' => false, 'error' => 'Please enter the e-wallet reference number for the balance.'], 422);
    }
    if ($method === 'CASH') {
        $reference = 'CASH-' . time();
    }
    $balance_paid = ['service' => STORE_PAYMENT_METHODS[$method]['service'], 'amount' => $amounts['balance']];
}

try {
    $pdo->beginTransaction();
    if ($balance_paid) {
        $stmt = $pdo->prepare("INSERT INTO payments (reference_number, service, image, mobile, amount) VALUES (?, ?, ?, 'In store', ?)");
        $stmt->execute([$reference, $balance_paid['service'], STORE_PAYMENT_METHODS[$method]['image'], $balance_paid['amount']]);
        $pdo->prepare('UPDATE orders SET status = ?, date_completed = NOW(), balance_payment_id = ? WHERE id = ?')
            ->execute([$new_status, (int) $pdo->lastInsertId(), $order_id]);
    } elseif (in_array($new_status, FINAL_STATUSES, true)) {
        $pdo->prepare('UPDATE orders SET status = ?, date_completed = NOW() WHERE id = ?')->execute([$new_status, $order_id]);
    } else {
        $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$new_status, $order_id]);
    }
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('update-order-status.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Failed to update order status'], 500);
}

$log = "Order ID: {$order_id}; Status changed from '{$old_status}' to '{$new_status}'";
if ($balance_paid) {
    $log .= '; balance of ' . peso_text($balance_paid['amount']) . " paid by {$balance_paid['service']}";
}
log_action($pdo, $admin['username'], 'Change Order Status', $log);

// Email the customer (not for Pending, and not for the walk-in account, which has no real inbox)
$email_sent = null;
if ($new_status !== 'pending' && $order['username'] !== 'walkin_guest') {
    $stmt = $pdo->prepare('SELECT oi.quantity, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?');
    $stmt->execute([$order_id]);
    $products = '';
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $products .= "• {$item['name']} (Qty: {$item['quantity']})\n";
    }

    $config = require __DIR__ . '/../../config/app.php';
    $name = $order['first_name'];
    $sign_off = "Best regards,\nThe LA Consolacion Jewelry Team";
    // How to reach the shop. The old text put the admin email in the Phone line too; the phone line now only
    // shows when the config has a store_phone (optional, e.g. 'store_phone' => '0917 123 4567').
    $reach = '';
    if (!empty($config['store_phone'])) {
        $reach .= "• Phone: {$config['store_phone']}\n";
    }
    $reach .= "• Email: {$config['admin_email']}\n• Visit our store\n";
    // Ready for pickup: what is left to pay. Completed: confirms the balance that was just recorded.
    $pickup_balance = $amounts['balance'] > 0
        ? 'Balance to pay at pickup: ' . peso_text($amounts['balance']) . ' (total ' . peso_text($amounts['total']) . ', paid ' . peso_text($amounts['paid']) . ").\n\n"
        : "Your order is fully paid.\n\n";
    $completed_paid = $balance_paid
        ? 'We received your balance of ' . peso_text($balance_paid['amount']) . " ({$balance_paid['service']}). Your order is fully paid.\n\n"
        : '';
    $emails = [
        'processing' => [
            'Your Order is Being Processed - LA Consolacion Jewelry',
            "Dear {$name},\n\nWe are processing your order #{$order_id}.\n\nYour order includes:\n{$products}\nWe're working hard to prepare your jewelry items with care and attention to detail.\n\nThank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
        'waiting_for_buyer' => [
            'Your Order is Ready for Pickup - LA Consolacion Jewelry',
            "Dear {$name},\n\nReady for pickup! Your order #{$order_id} is ready.\n\nYour order includes:\n{$products}\n{$pickup_balance}Contact us or go to the location to collect your jewelry items.\n\nYou can reach us through:\n{$reach}\nThank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
        'completed' => [
            'Your Order is Completed - LA Consolacion Jewelry',
            "Dear {$name},\n\nThe order #{$order_id} is completed.\n\nYour order includes:\n{$products}\n{$completed_paid}Thank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
        // Only sent when the shop cancels (a customer cancelling their own order gets no email), so it does not
        // say who cancelled it
        'cancelled' => [
            'Your Order Has Been Cancelled - LA Consolacion Jewelry',
            "Dear {$name},\n\nYour order #{$order_id} has been cancelled.\n\nYour order included:\n{$products}\nIf you have any questions, please contact us:\n{$reach}\nThank you for considering LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
    ];
    [$subject, $text] = $emails[$new_status];
    $email_sent = send_mail($order['email'], $subject, $text, '/send-order-notification');

    // Same log entries as before, so the Logs page shows whether the email went out
    if ($email_sent) {
        log_action($pdo, $admin['username'], 'Email Notification', "{$new_status} notification sent to {$order['email']} for Order #{$order_id}");
    } else {
        log_action($pdo, $admin['username'], 'Email Notification Failed', "Failed to send {$new_status} notification to {$order['email']} for Order #{$order_id}");
    }
}

json_response(['success' => true, 'status' => $new_status, 'emailSent' => $email_sent, 'balanceRecorded' => $balance_paid !== null]);
