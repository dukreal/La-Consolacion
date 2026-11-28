<?php
// The customer pays the rest of a delivery order online (Pay for Your Order page): the balance plus the shipping fee.
// POST form: order_id, mobile (11 digits), reference, payment_screenshot (image). Saved as an InstaPay payment
// (the customer scans the shop's InstaPay QR with any e-wallet or bank app).
// The amount is worked out here (never sent by the browser). It is saved as the order's balance payment with
// orders.balance_to_check = 1: it counts as paid once the admin checks it in the Shipping panel.
// Only when helpers/payments.php can_pay_online() allows it. Answers { success, amount } or { success: false, error }.
require_once __DIR__ . '/../../helpers/customer.php';
require_once __DIR__ . '/../../helpers/payments.php';
require_once __DIR__ . '/../../helpers/upload.php';

$user_id = require_customer();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}
reject_oversized_post();

$order_id = (int) ($_POST['order_id'] ?? 0);
$service = ONLINE_PAYMENT_SERVICE;
$mobile = preg_replace('/\D/', '', $_POST['mobile'] ?? '');
$reference = trim($_POST['reference'] ?? '');
$fail = fn (string $message, int $code = 422) => json_response(['success' => false, 'error' => $message], $code);

if ($order_id < 1) {
    $fail('Order ID is required');
}
if (!preg_match('/^\d{11}$/', $mobile)) {
    $fail('Mobile number must be exactly 11 digits.');
}
if ($reference === '' || mb_strlen($reference) > 100) {
    $fail('Please enter the reference number of your payment.');
}

// [amounts, null] when this order can be paid online now, else [null, [message, http code]]
$check = function () use ($pdo, $order_id, $user_id): array {
    // Only the customer's own orders
    $stmt = $pdo->prepare('SELECT status, fulfillment, shipping_fee FROM orders WHERE id = ? AND user_id = ? AND deleted = 0');
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch();
    if (!$order) {
        return [null, ['Order not found', 404]];
    }
    $amounts = order_amounts($pdo, $order_id);
    if (!can_pay_online($order, $amounts)) {
        return [null, [$amounts['balanceSubmitted']
            ? 'You have already paid for this order. We are checking your payment.'
            : 'This order cannot be paid online right now. Please refresh the page.', 409]];
    }
    return [$amounts, null];
};

try {
    [$amounts, $refused] = $check(); // before saving the picture, so a refused payment leaves no file behind
} catch (PDOException $e) {
    error_log('pay-balance.php database error: ' . $e->getMessage());
    $fail('Database error. Please try again.', 500);
}
if ($refused) {
    $fail(...$refused);
}

$image = save_payment_screenshot('payment_screenshot');

try {
    $pdo->beginTransaction();
    $pdo->prepare('SELECT id FROM orders WHERE id = ? FOR UPDATE')->execute([$order_id]); // one payment at a time
    [$amounts, $refused] = $check(); // again, inside the lock: the fee may have changed, or another tab paid first
    if ($refused) {
        $pdo->rollBack();
        @unlink(__DIR__ . '/../../uploads/payments/' . $image);
        $fail(...$refused);
    }
    $pdo->prepare('INSERT INTO payments (reference_number, service, image, mobile, amount, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())')
        ->execute([$reference, $service, $image, $mobile, $amounts['balance']]);
    $pdo->prepare('UPDATE orders SET balance_payment_id = ?, balance_to_check = 1 WHERE id = ?')
        ->execute([(int) $pdo->lastInsertId(), $order_id]);
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    @unlink(__DIR__ . '/../../uploads/payments/' . $image);
    error_log('pay-balance.php database error: ' . $e->getMessage());
    $fail('Database error. Please try again.', 500);
}

log_action($pdo, $_SESSION['username'] ?? 'customer', 'Pay Balance Online', "Order ID: {$order_id}; " . peso_text($amounts['balance']) . " paid by {$service}, ref. {$reference}; waiting to be checked");

json_response(['success' => true, 'amount' => $amounts['balance']]);
