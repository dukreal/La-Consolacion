<?php
// Changes an order's status from the Details pop-up on the admin Orders page. Any admin can do it.
// POST form: order_id, new_status (pending, processing, waiting_for_buyer, completed, cancelled)
//            balance_method (CASH, GCASH, PAYMAYA, GOTYME) and balance_reference (e-wallets only):
//            needed for Completed when the customer still owes part of the price (the 70% after the downpayment);
//            that payment is saved as a second payments row (orders.balance_payment_id), in the same step.
//
// Completed and Cancelled are final: they also set date_completed, and after that the order is locked.
// The customer gets an email for every status except Pending.
// Cancelled puts the order's items back into stock (helpers/stock.php), the same as when the customer cancels.
// Delivery orders (helpers/delivery.php) get their own Ready to Ship email (balance, shipping fee and a Pay online
// link) and On Its Way email (courier and tracking number), with the delivery address.
//
// Delivery orders also send:
//   shipping_fee (pesos): needed for Waiting for Buyer (Ready to ship); it is added to what the customer pays.
//                         Sending it again changes it, until the customer has paid the rest.
//   courier, tracking_number: needed for Completed (On its way). A balance the customer paid online
//                         (orders.balance_to_check = 1) counts as checked by the admin at that moment.
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/delivery-emails.php'; // the delivery email pieces, notify_customer()
require_once __DIR__ . '/../../helpers/payments.php';
require_once __DIR__ . '/../../helpers/stock.php';
require_once __DIR__ . '/../../helpers/delivery.php';
require_once __DIR__ . '/../../helpers/orders.php'; // order_ref(): LCJ-0951 in the emails

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
    $stmt = $pdo->prepare('SELECT o.status, o.payment_id, o.date_completed, o.fulfillment, ' . implode(', ', address_columns('o.delivery_')) . ',
                                  o.shipping_fee, o.balance_payment_id,
                                  u.email, u.first_name, u.username
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

// Delivery orders: the shipping fee (Ready), the courier and tracking number (On its way), saved with the status
$is_delivery = $order['fulfillment'] === 'delivery';
$set = []; // more orders columns to save with the status: column => value (the names are fixed here, never from the form)
$fail = fn (string $message) => json_response(['success' => false, 'error' => $message], 422);
if ($is_delivery && in_array($new_status, ['waiting_for_buyer', 'completed'], true) && isset($_POST['shipping_fee'])) {
    $fee = read_shipping_fee($_POST['shipping_fee']);
    if ($fee === null) {
        $fail('Please enter the shipping fee in pesos, for example 180 or 180.50.');
    }
    if ($order['balance_payment_id'] !== null && $order['shipping_fee'] !== null && (float) $order['shipping_fee'] !== $fee) {
        $fail('The customer has already paid the rest, so the shipping fee can no longer change.');
    }
    $set['shipping_fee'] = $fee;
}
$fee_set = array_key_exists('shipping_fee', $set) || $order['shipping_fee'] !== null;
if ($is_delivery && $new_status === 'waiting_for_buyer' && !$fee_set) {
    $fail('Please enter the shipping fee. The customer pays it with the balance before you ship.');
}
if ($is_delivery && $new_status === 'completed') {
    if (!$fee_set) {
        $fail('Please enter the shipping fee first.');
    }
    [$courier, $tracking, $tracking_errors] = read_tracking($_POST);
    if ($tracking_errors) {
        $fail(implode(' ', $tracking_errors));
    }
    $set['courier'] = $courier;
    $set['tracking_number'] = $tracking;
    if ($amounts['balanceSubmitted']) {
        $set['balance_to_check'] = 0; // the admin checked the customer's online payment
    }
}

// What the customer still owes once these are saved: a new fee changes it, a checked online payment counts
$fee_now = $set['shipping_fee'] ?? ($amounts['shippingFee'] ?? 0);
$paid_now = $amounts['paid'] + (isset($set['balance_to_check']) ? $amounts['balanceSubmitted']['amount'] : 0);
$balance_due = max(0, round($amounts['itemsTotal'] + $fee_now - $paid_now, 2));
if ($new_status === 'completed' && $balance_due > 0 && isset($set['balance_to_check'])) {
    $fail('The payment to check is less than what the customer owes (' . peso_text($balance_due) . ' short). Use "Wrong payment" and ask the customer to pay again.');
}

// Completing an order that is not fully paid: the admin says how the balance was paid (at the store, or by chat
// for a delivery order)
$balance_paid = null; // ['service' => ..., 'amount' => ...] when it is recorded now
if ($new_status === 'completed' && $balance_due > 0) {
    $method = $_POST['balance_method'] ?? '';
    $reference = trim($_POST['balance_reference'] ?? '');
    if (!isset(STORE_PAYMENT_METHODS[$method])) {
        json_response(['success' => false, 'error' => 'Please choose how the balance of ' . peso_text($balance_due) . ' was paid.'], 422);
    }
    if ($method !== 'CASH' && $reference === '') {
        json_response(['success' => false, 'error' => 'Please enter the InstaPay reference number for the balance.'], 422);
    }
    if ($method === 'CASH') {
        $reference = 'CASH-' . time();
    }
    $balance_paid = ['service' => STORE_PAYMENT_METHODS[$method]['service'], 'amount' => $balance_due];
}

// ", shipping_fee = ?, courier = ?" and its values, added to the UPDATE below
$set_sql = implode('', array_map(fn ($column) => ", {$column} = ?", array_keys($set)));
$set_values = array_values($set);

try {
    $pdo->beginTransaction();
    if ($balance_paid) {
        $stmt = $pdo->prepare("INSERT INTO payments (reference_number, service, image, mobile, amount) VALUES (?, ?, ?, 'In store', ?)");
        $stmt->execute([$reference, $balance_paid['service'], STORE_PAYMENT_METHODS[$method]['image'], $balance_paid['amount']]);
        $pdo->prepare("UPDATE orders SET status = ?, date_completed = NOW(), balance_payment_id = ?{$set_sql} WHERE id = ?")
            ->execute([$new_status, (int) $pdo->lastInsertId(), ...$set_values, $order_id]);
    } elseif (in_array($new_status, FINAL_STATUSES, true)) {
        // Only while the order is still open, so two clicks (or the customer cancelling at the same moment)
        // cannot put the stock back twice
        $stmt = $pdo->prepare("UPDATE orders SET status = ?, date_completed = NOW(){$set_sql} WHERE id = ? AND status NOT IN ('completed', 'cancelled')");
        $stmt->execute([$new_status, ...$set_values, $order_id]);
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            json_response(['success' => false, 'error' => 'This order was already completed or cancelled. Please refresh the page.'], 409);
        }
        if ($new_status === 'cancelled') {
            restore_order_stock($pdo, $order_id);
        }
    } else {
        $pdo->prepare("UPDATE orders SET status = ?{$set_sql} WHERE id = ?")->execute([$new_status, ...$set_values, $order_id]);
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
if (array_key_exists('shipping_fee', $set)) {
    $log .= '; shipping fee ' . peso_text($set['shipping_fee']);
}
if (isset($set['balance_to_check'])) {
    $log .= '; online payment of ' . peso_text($amounts['balanceSubmitted']['amount']) . " ({$amounts['balanceSubmitted']['service']}) checked";
}
if ($balance_paid) {
    $log .= '; balance of ' . peso_text($balance_paid['amount']) . " paid by {$balance_paid['service']}";
}
if (isset($set['courier'])) {
    $log .= "; shipped by {$set['courier']}, tracking {$set['tracking_number']}";
}
log_action($pdo, $admin['username'], 'Change Order Status', $log);

// The amounts as they are now (with a new shipping fee or a checked payment), for the emails
try {
    $amounts = order_amounts($pdo, $order_id);
} catch (PDOException $e) {
    error_log('update-order-status.php database error: ' . $e->getMessage()); // the status is saved; the email still goes
}

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
    $ref = order_ref($order_id); // how the customer sees the order: LCJ-0951
    $name = $order['first_name'];
    $sign_off = "Best regards,\nThe LA Consolacion Jewelry Team";
    $reach = shop_contact_text($config);
    // Pickup, Ready: what is left to pay at the store. Completed: confirms the balance that was just recorded.
    $balance_line = 'Balance to pay: ' . peso_text($amounts['balance']) . ' (total ' . peso_text($amounts['total']) . ', paid ' . peso_text($amounts['paid']) . ').';
    $pickup_balance = $amounts['balance'] > 0
        ? "{$balance_line} Please pay it when you pick up your order.\n\n"
        : "Your order is fully paid.\n\n";
    $completed_paid = $balance_paid
        ? 'We received your balance of ' . peso_text($balance_paid['amount']) . " ({$balance_paid['service']}). Your order is fully paid.\n\n"
        : '';
    // Delivery orders: where it goes. Ready: the balance, the shipping fee and the Pay online link.
    // On its way: the courier and tracking number, and the payment that was just checked or recorded.
    $delivery = $is_delivery ? address_from_row($order, 'delivery_') : null;
    $address_block = $delivery ? address_text($delivery) . "\n\n" : '';
    if ($delivery) {
        $ship_pay = delivery_amount_text($amounts) . "\n" . delivery_pay_text($config, $order_id, $amounts) . "\n";
        $ship_tracking = isset($set['courier']) ? tracking_text($set['courier'], $set['tracking_number']) . "\n" : '';
        $ship_paid = ($balance_paid || isset($set['balance_to_check'])) && $amounts['balancePayment']
            ? payment_received_text($amounts['balancePayment'], $amounts) . "\n"
            : '';
    }
    $ready_text = $delivery
        ? "Dear {$name},\n\nGood news! Your order {$ref} is ready to ship.\n\nYour order includes:\n{$products}\nWe will send it by LBC or another courier to:\n{$address_block}{$ship_pay}You can reach us through:\n{$reach}\nThank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}"
        : "Dear {$name},\n\nGood news! Your order {$ref} is ready for pickup.\n\nYour order includes:\n{$products}\n{$pickup_balance}You can pick it up at our store. If you would rather have it shipped via LBC or another courier (shipping fee paid by you), contact us to arrange it.\n\nYou can reach us through:\n{$reach}\nThank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}";
    $completed_text = $delivery
        ? "Dear {$name},\n\nYour order {$ref} is completed and on its way to you by courier, to:\n{$address_block}{$ship_tracking}Your order includes:\n{$products}\n{$ship_paid}Thank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}"
        : "Dear {$name},\n\nYour order {$ref} is completed.\n\nYour order includes:\n{$products}\n{$completed_paid}Thank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}";
    $emails = [
        'processing' => [
            'Your Order is Being Processed - LA Consolacion Jewelry',
            "Dear {$name},\n\nWe are processing your order {$ref}.\n\nYour order includes:\n{$products}\nWe're working hard to prepare your jewelry items with care and attention to detail.\n\nThank you for choosing LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
        'waiting_for_buyer' => [
            $delivery ? 'Your Order is Ready to Ship - LA Consolacion Jewelry' : 'Your Order is Ready - LA Consolacion Jewelry',
            $ready_text,
        ],
        'completed' => [
            $delivery ? 'Your Order is On Its Way - LA Consolacion Jewelry' : 'Your Order is Completed - LA Consolacion Jewelry',
            $completed_text,
        ],
        // Only sent when the shop cancels (a customer cancelling their own order gets no email), so it does not
        // say who cancelled it
        'cancelled' => [
            'Your Order Has Been Cancelled - LA Consolacion Jewelry',
            "Dear {$name},\n\nYour order {$ref} has been cancelled.\n\nYour order included:\n{$products}\nIf you have any questions, please contact us:\n{$reach}\nThank you for considering LA Consolacion Jewelry!\n\n{$sign_off}",
        ],
    ];
    [$subject, $text] = $emails[$new_status];
    // Also writes the same Logs entries as before, so the Logs page shows whether the email went out
    $email_sent = notify_customer($pdo, $admin['username'], $order_id, $order, $new_status, $subject, $text);
}

json_response([
    'success'         => true,
    'status'          => $new_status,
    'emailSent'       => $email_sent,
    'balanceRecorded' => $balance_paid !== null || isset($set['balance_to_check']), // fully paid now
]);
