<?php
// The Shipping panel in the admin's Order Details (delivery orders only). Any admin can use it.
// POST form: order_id, action, and:
//   action=fee             shipping_fee: change the fee of a Ready (Waiting for Buyer) order, until the customer
//                          has paid the rest. (The fee is first set with the status: update-order-status.php.)
//   action=reject_payment  "Wrong payment": takes back the balance the customer paid online, before it is
//                          checked, so the Pay button comes back for them. The payment row and its screenshot stay
//                          for the record. The customer is emailed to pay again; the admin can also message them.
//   action=tracking        "Edit tracking": courier, tracking_number, after the order shipped (Completed), e.g. a typo.
// The customer gets an email for each (helpers/delivery-emails.php): the new amount to pay, that the payment could
// not be confirmed (with the Pay online link again), or the corrected tracking number. No email when nothing changed.
// Answers { success, message, emailSent } or { success: false, error }. emailSent: true, false (the mailer failed;
// message says so) or null (no email).
require_once __DIR__ . '/../../helpers/admin.php';
require_once __DIR__ . '/../../helpers/payments.php';
require_once __DIR__ . '/../../helpers/delivery.php';
require_once __DIR__ . '/../../helpers/delivery-emails.php';

$admin = require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Invalid request'], 405);
}

$config = require __DIR__ . '/../../config/app.php';
$email = null; // [what (for the Logs page), subject, body, what to tell the admin when it was sent]

$order_id = (int) ($_POST['order_id'] ?? 0);
$ref = order_ref($order_id); // how the customer sees the order in the emails: LCJ-0951
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
        $changed = $order['shipping_fee'] === null || (float) $order['shipping_fee'] !== $fee;
        $pdo->prepare('UPDATE orders SET shipping_fee = ? WHERE id = ?')->execute([$fee, $order_id]);
        $old = $order['shipping_fee'] !== null ? peso_text((float) $order['shipping_fee']) : 'none';
        log_action($pdo, $admin['username'], 'Change Shipping Fee', "Order ID: {$order_id}; shipping fee changed from {$old} to " . peso_text($fee));
        $message = 'Shipping fee changed to ' . peso_text($fee) . '.';
        if ($changed) {
            $amounts = order_amounts($pdo, $order_id);
            $email = [
                'shipping fee',
                'Shipping Fee Updated - LA Consolacion Jewelry',
                "The shipping fee for your order {$ref} is now " . peso_text($fee) . ". Here is the updated amount:\n\n"
                    . delivery_amount_text($amounts) . "\n" . delivery_pay_text($config, $order_id, $amounts),
                'We emailed the customer the new amount to pay.',
            ];
        }
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
        $message = 'Payment removed. The customer can pay again.';
        $amounts = order_amounts($pdo, $order_id); // without the removed payment: what they still have to pay
        $email = [
            'payment not confirmed',
            "We Couldn't Confirm Your Payment - LA Consolacion Jewelry",
            "We couldn't confirm your payment of " . peso_text($paid['amount']) . ' (' . service_name($paid['service']) . ", reference no. {$paid['reference_number']}) for your order {$ref}.\n\n"
                . "Please check the amount and the reference number, then pay again:\n\n"
                . delivery_amount_text($amounts) . "\n" . delivery_pay_text($config, $order_id, $amounts)
                . "\nIf you think this is a mistake, please contact us and we will sort it out.\n",
            'We emailed them to pay again. You can also message them to explain what was wrong.',
        ];
    } else {
        if ($order['status'] !== 'completed') {
            $fail('The courier and tracking number are filled in when the order ships (Completed).');
        }
        [$courier, $tracking, $errors] = read_tracking($_POST);
        if ($errors) {
            $fail(implode(' ', $errors));
        }
        $changed = $courier !== $order['courier'] || $tracking !== $order['tracking_number'];
        $pdo->prepare('UPDATE orders SET courier = ?, tracking_number = ? WHERE id = ?')->execute([$courier, $tracking, $order_id]);
        log_action(
            $pdo,
            $admin['username'],
            'Fix Tracking Number',
            "Order ID: {$order_id}; {$order['courier']} {$order['tracking_number']} changed to {$courier} {$tracking}"
        );
        $message = 'Tracking number updated.';
        if ($changed) {
            $email = [
                'tracking update',
                'Updated Tracking Number - LA Consolacion Jewelry',
                "We corrected the tracking details for your order {$ref}. Please use these instead:\n\n"
                    . tracking_text($courier, $tracking)
                    . "\nSorry for the mix-up.\n",
                'We emailed the customer the new tracking number.',
            ];
        }
    }
} catch (PDOException $e) {
    error_log('update-shipping.php database error: ' . $e->getMessage());
    $fail('Database error. Please try again.', 500);
}

// Email the customer (the walk-in account has no real inbox: notify_customer skips it)
$email_sent = null;
if ($email) {
    [$what, $subject, $body, $when_sent] = $email;
    try {
        $customer = order_customer($pdo, $order_id);
    } catch (PDOException $e) {
        error_log('update-shipping.php database error: ' . $e->getMessage()); // saved; only the email is skipped
        $customer = null;
        $message .= email_note(false, '');
    }
    if ($customer) {
        $text = "Dear {$customer['first_name']},\n\n" . $body
            . "\nYou can reach us through:\n" . shop_contact_text($config)
            . "\nThank you for choosing LA Consolacion Jewelry!\n\nBest regards,\nThe LA Consolacion Jewelry Team";
        $email_sent = notify_customer($pdo, $admin['username'], $order_id, $customer, $what, $subject, $text);
        $message .= email_note($email_sent, $when_sent);
    }
}

json_response(['success' => true, 'message' => $message, 'emailSent' => $email_sent]);
