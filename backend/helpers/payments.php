<?php
// Payments made at the store: walk-in sales (api/admin/walk-in.php) and the balance a customer pays at pickup
// (api/orders/update-order-status.php). Same payment names and pictures the old walk-in page saved.
const STORE_PAYMENT_METHODS = [
    'CASH'    => ['service' => 'Cash',    'image' => 'cash_default.png'],
    'GCASH'   => ['service' => 'GCash',   'image' => 'gcash-logo.png'],
    'PAYMAYA' => ['service' => 'PayMaya', 'image' => 'maya-logo.png'],
    'GOTYME'  => ['service' => 'GoTyme',  'image' => 'gotyme-logo.png'],
];

// How much an order costs, how much has been paid and what is left.
//   total:   the order items added up
//   paid:    the downpayment (orders.payment_id) plus the balance payment, if recorded (orders.balance_payment_id)
//   balance: what the customer still owes (never below 0; centavos rounded)
//   balancePayment: the recorded balance payment row (service, reference_number, amount, uploaded_at) or null
function order_amounts(PDO $pdo, int $order_id): array
{
    $stmt = $pdo->prepare('SELECT COALESCE(SUM(price_at_purchase * quantity), 0) FROM order_items WHERE order_id = ?');
    $stmt->execute([$order_id]);
    $total = (float) $stmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT dp.amount AS down_amount, bp.service, bp.reference_number, bp.amount, bp.uploaded_at
         FROM orders o
         LEFT JOIN payments dp ON dp.id = o.payment_id
         LEFT JOIN payments bp ON bp.id = o.balance_payment_id
         WHERE o.id = ?'
    );
    $stmt->execute([$order_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $down = (float) ($row['down_amount'] ?? 0);
    $balance_payment = isset($row['amount']) ? [
        'service'          => $row['service'],
        'reference_number' => $row['reference_number'],
        'amount'           => (float) $row['amount'],
        'uploaded_at'      => $row['uploaded_at'],
    ] : null;
    $paid = $down + ($balance_payment['amount'] ?? 0);

    return [
        'total'          => $total,
        'downpayment'    => $down,
        'paid'           => $paid,
        'balance'        => max(0, round($total - $paid, 2)),
        'balancePayment' => $balance_payment,
    ];
}

// "₱3,500.00", for emails
function peso_text(float $amount): string
{
    return '₱' . number_format($amount, 2);
}
