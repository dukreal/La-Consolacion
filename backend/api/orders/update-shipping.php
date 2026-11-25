<?php
// The Shipping panel in the admin's Order Details (delivery orders only). Any admin can use it.
// POST form: order_id, action, and:
//   action=fee             shipping_fee: change the fee of a Ready (Waiting for Buyer) order, until the customer
//                          has paid the rest. (The fee is first set with the status: update-order-status.php.)
//   action=reject_payment  "Payment doesn't match": takes back the balance the customer paid online, before it is
//                          checked, so the Pay button comes back for them. The payment row and its screenshot stay
//                          for the record. The admin contacts the customer to explain.
//   action=tracking        courier, tracking_number: fix them after the order shipped (Completed), e.g. a typo.
// Answers { success, message } or { success: false, error }.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/payments.php';
require_once __DIR__ . '/../../helpers/delivery.php';

$admin = require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$order_id = (int) ($_POST['order_id'] ?? 0);
$action = $_POST['action'] ?? '';
if (!$order_id || !in_array($action, ['fee', 'reject_payment', 'tracking'], true)) {
    json_response(['success' => false, 'error' => 'Invalid request'], 400);
}
$fail = fn (string $message, int $code = 422) => json_response(['success' => false, 'error' => $message], $code);

try {
    $stmt = $pdo->prepare(
        'SELECT status, fulfillment, shipping_fee, courier, tracking_number, balance_payment_id, balance_to_check
         FROM orders WHERE id = ? AND deleted = 0'
    );
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('update-shipping.php database error: ' . $e->getMessage());
    $fail('Database error. Please try again.', 500);
}
if (!$order) {
    $fail('Order not found', 404);
}
if ($order['fulfillment'] !== 'delivery') {
    $fail('Only delivery orders have shipping details.');
}

try {
    if ($action === 'fee') {
        if ($order['status'] !== 'waiting_for_buyer') {
            $fail('The shipping fee can only change while the order is Ready (Waiting for Buyer).');
        }
        if ($order['balance_payment_id'] !== null) {
            $fail('The customer has already paid the rest, so the shipping fee can no longer change.');
        }
        $fee = read_shipping_fee($_POST['shipping_fee'] ?? '');
        if ($fee === null) {
            $fail('Please enter the shipping fee in pesos, for example 180 or 180.50.');
        }
        $pdo->prepare('UPDATE orders SET shipping_fee = ? WHERE id = ?')->execute([$fee, $order_id]);
        $old = $order['shipping_fee'] !== null ? peso_text((float) $order['shipping_fee']) : 'none';
        log_action($pdo, $admin['username'], 'Change Shipping Fee', "Order ID: {$order_id}; shipping fee changed from {$old} to " . peso_text($fee));
        $message = 'Shipping fee changed to ' . peso_text($fee) . '.';
    } elseif ($action === 'reject_payment') {
        if ($order['balance_payment_id'] === null || (int) $order['balance_to_check'] !== 1) {
            $fail('There is no online payment waiting to be checked on this order.');
        }
        $amounts = order_amounts($pdo, $order_id);
        // Only while it is still waiting to be checked, so a second click does nothing
        $stmt = $pdo->prepare('UPDATE orders SET balance_payment_id = NULL, balance_to_check = 0 WHERE id = ? AND balance_to_check = 1');
        $stmt->execute([$order_id]);
        $paid = $amounts['balanceSubmitted'];
        log_action(
            $pdo,
            $admin['username'],
            "Payment Doesn't Match",
            "Order ID: {$order_id}; online payment of " . peso_text($paid['amount']) . " ({$paid['service']}, ref. {$paid['reference_number']}) taken back"
        );
        $message = 'The payment was taken back. The customer can pay again; please contact them to explain.';
    } else {
        if ($order['status'] !== 'completed') {
            $fail('The courier and tracking number are filled in when the order ships (Completed).');
        }
        [$courier, $tracking, $errors] = read_tracking($_POST);
        if ($errors) {
            $fail(implode(' ', $errors));
        }
        $pdo->prepare('UPDATE orders SET courier = ?, tracking_number = ? WHERE id = ?')->execute([$courier, $tracking, $order_id]);
        log_action(
            $pdo,
            $admin['username'],
            'Fix Tracking Number',
            "Order ID: {$order_id}; {$order['courier']} {$order['tracking_number']} changed to {$courier} {$tracking}"
        );
        $message = 'Tracking number saved.';
    }
} catch (PDOException $e) {
    error_log('update-shipping.php database error: ' . $e->getMessage());
    $fail('Database error. Please try again.', 500);
}

json_response(['success' => true, 'message' => $message]);
