<?php
// One payment for the Payment pop-up on the admin Orders page. GET ?id=N (the payment id).
// Admins only: the old file had no login check, so anyone could read payment screenshots and mobile numbers.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/payments.php';

require_admin();

$payment_id = (int) ($_GET['id'] ?? 0);
if (!$payment_id) {
    json_response(['success' => false, 'error' => 'No payment ID provided'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT p.reference_number, p.service, p.uploaded_at, p.image, p.mobile, p.amount, o.id AS order_id, o.date_ordered, o.status
         FROM payments p
         JOIN orders o ON o.payment_id = p.id
         WHERE p.id = ?'
    );
    $stmt->execute([$payment_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$payment) {
        json_response(['success' => false, 'error' => 'Payment not found'], 404);
    }

    $amounts = order_amounts($pdo, (int) $payment['order_id']);
} catch (PDOException $e) {
    error_log('get-payment-details.php database error: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Database error. Please try again.'], 500);
}

// Walk-in sales store the e-wallet logo name instead of a screenshot (see admin/walk-in.php)
$is_walk_in = $payment['mobile'] === 'Walk-in';
$screenshot = !$is_walk_in && $payment['image'] && is_file(__DIR__ . '/../../uploads/payments/' . $payment['image'])
    ? '/uploads/payments/' . $payment['image'] : null;

json_response([
    'success'         => true,
    'orderId'         => (int) $payment['order_id'],
    'referenceNumber' => $payment['reference_number'],
    'service'         => payment_service_name($payment['service']),
    'uploadedAt'      => $payment['uploaded_at'],
    'dateOrdered'     => $payment['date_ordered'],
    'mobile'          => $payment['mobile'],
    'amount'          => (float) $payment['amount'],
    'orderTotal'      => $amounts['total'],
    'orderStatus'     => strtolower($payment['status']),
    // The balance paid at pickup (recorded with Confirm Order → Completed), or null; and what is still owed
    'balancePayment'  => $amounts['balancePayment'] ? [
        'service'         => $amounts['balancePayment']['service'],
        'referenceNumber' => $amounts['balancePayment']['reference_number'],
        'amount'          => $amounts['balancePayment']['amount'],
        'paidAt'          => $amounts['balancePayment']['uploaded_at'],
    ] : null,
    'balance'         => $amounts['balance'],
    'imageUrl'        => $screenshot,
    'isWalkIn'        => $is_walk_in,
]);
