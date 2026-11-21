<?php
// Puts an order's items back into stock when the order is cancelled, by the customer
// (api/orders/cancel-order.php) or by the shop (api/orders/update-order-status.php).
//
// Stock only goes down when an order is paid (api/orders/payment.php), so an unpaid order
// (such as a custom order the customer never paid) gives nothing back.
// Call it inside the same transaction that sets the order to cancelled.
function restore_order_stock(PDO $pdo, int $order_id): void
{
    $stmt = $pdo->prepare('SELECT payment_id FROM orders WHERE id = ?');
    $stmt->execute([$order_id]);
    if ($stmt->fetchColumn() === null) {
        return;
    }

    // stock = stock + quantity in the database itself, so a sale at the same moment is not lost
    $pdo->prepare(
        'UPDATE products p
         JOIN (SELECT product_id, SUM(quantity) AS qty FROM order_items WHERE order_id = ? GROUP BY product_id) oi
           ON oi.product_id = p.id
         SET p.stock = p.stock + oi.qty'
    )->execute([$order_id]);
}
