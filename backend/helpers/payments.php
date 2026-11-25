<?php
// Payments made at the store: walk-in sales (api/admin/walk-in.php) and the balance a customer pays at pickup
// (api/orders/update-order-status.php), or pays by chat for a delivery order.
// Same payment names and pictures the old walk-in page saved.
const STORE_PAYMENT_METHODS = [
    'CASH'    => ['service' => 'Cash',    'image' => 'cash_default.png'],
    'GCASH'   => ['service' => 'GCash',   'image' => 'gcash-logo.png'],
    'PAYMAYA' => ['service' => 'PayMaya', 'image' => 'maya-logo.png'],
    'GOTYME'  => ['service' => 'GoTyme',  'image' => 'gotyme-logo.png'],
];

// How much an order costs, how much has been paid and what is left.
//   itemsTotal:  the order items added up
//   shippingFee: the courier fee of a delivery order (orders.shipping_fee), or null when none is set
//   total:       itemsTotal + shippingFee
//   paid:        the downpayment (orders.payment_id) plus the balance payment once it counts (orders.balance_payment_id):
//                one the admin recorded, or one the customer paid online and the admin has checked
//   balance:     what the customer still owes (never below 0; centavos rounded)
//   balancePayment:   the balance payment that counts (service, reference_number, amount, uploaded_at), or null
//   balanceSubmitted: a balance the customer paid online that the admin has not checked yet
//                     (orders.balance_to_check = 1; the same keys plus mobile and image), or null.
//                     It is not in paid or balance until the admin checks it.
function order_amounts(PDO $pdo, int $order_id): array
{
    $stmt = $pdo->prepare('SELECT COALESCE(SUM(price_at_purchase * quantity), 0) FROM order_items WHERE order_id = ?');
    $stmt->execute([$order_id]);
    $items_total = (float) $stmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT o.shipping_fee, o.balance_to_check, dp.amount AS down_amount,
                bp.service, bp.reference_number, bp.amount, bp.uploaded_at, bp.mobile, bp.image
         FROM orders o
         LEFT JOIN payments dp ON dp.id = o.payment_id
         LEFT JOIN payments bp ON bp.id = o.balance_payment_id
         WHERE o.id = ?'
    );
    $stmt->execute([$order_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $fee = isset($row['shipping_fee']) ? (float) $row['shipping_fee'] : null;
    $down = (float) ($row['down_amount'] ?? 0);
    $balance_row = isset($row['amount']) ? [
        'service'          => $row['service'],
        'reference_number' => $row['reference_number'],
        'amount'           => (float) $row['amount'],
        'uploaded_at'      => $row['uploaded_at'],
    ] : null;
    $to_check = $balance_row && (int) $row['balance_to_check'] === 1;

    $total = $items_total + ($fee ?? 0);
    $paid = $down + ($balance_row && !$to_check ? $balance_row['amount'] : 0);

    return [
        'itemsTotal'       => $items_total,
        'shippingFee'      => $fee,
        'total'            => $total,
        'downpayment'      => $down,
        'paid'             => $paid,
        'balance'          => max(0, round($total - $paid, 2)),
        'balancePayment'   => $to_check ? null : $balance_row,
        'balanceSubmitted' => $to_check ? $balance_row + ['mobile' => $row['mobile'], 'image' => $row['image']] : null,
    ];
}

// "₱3,500.00", for emails
function peso_text(float $amount): string
{
    return '₱' . number_format($amount, 2);
}

// Can the customer pay the rest online (the Pay for Your Order page)? Only a delivery order that is Ready
// (Waiting for Buyer), with its shipping fee set, still owing money and with nothing paid online yet.
// $order needs status, fulfillment and shipping_fee; $amounts comes from order_amounts().
function can_pay_online(array $order, array $amounts): bool
{
    return $order['fulfillment'] === 'delivery'
        && $order['status'] === 'waiting_for_buyer'
        && $order['shipping_fee'] !== null
        && $amounts['balance'] > 0
        && $amounts['balanceSubmitted'] === null;
}
