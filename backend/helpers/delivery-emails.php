<?php
// The pieces of the customer emails for delivery orders, and sending them.
// Used by the status emails (api/orders/update-order-status.php: Ready to Ship, On Its Way) and by the Shipping
// panel (api/orders/update-shipping.php: shipping fee changed, payment not confirmed, tracking number corrected).
// The emails are plain text, sent through the Node mailer (helpers/mailer.php).
require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/payments.php';
require_once __DIR__ . '/delivery.php';
require_once __DIR__ . '/orders.php';

// How to reach the shop, as "• Email: ..." lines. The phone line only shows when config/app.php has a
// store_phone (optional, e.g. 'store_phone' => '0917 123 4567').
function shop_contact_text(array $config): string
{
    $reach = '';
    if (!empty($config['store_phone'])) {
        $reach .= "• Phone: {$config['store_phone']}\n";
    }
    return $reach . "• Email: {$config['admin_email']}\n• Visit our store\n";
}

// The Pay for Your Order page of an order, e.g. http://localhost:5173/orders/LCJ-0030/pay
// (the customer logs in first if needed, then comes back to it)
function pay_link(array $config, int $order_id): string
{
    return rtrim($config['frontend_url'], '/') . '/orders/' . order_ref($order_id) . '/pay';
}

// What the customer still has to pay, from order_amounts():
//   Balance: ₱5,599.30 (total ₱7,999.00, paid ₱2,399.70)
//   Shipping fee: ₱180.00
//   Total to pay: ₱5,779.30
// When the items are already fully paid, only the shipping fee is left to pay.
// When the customer already sent a payment that is being checked, it says "Total" instead of "to pay".
function delivery_amount_text(array $amounts): string
{
    if ($amounts['balance'] <= 0) {
        return "Your order is fully paid.\n";
    }
    $to_pay = $amounts['balanceSubmitted'] ? '' : ' to pay';
    $fee = peso_text($amounts['shippingFee'] ?? 0);
    $items_balance = max(0, round($amounts['itemsTotal'] - $amounts['paid'], 2));
    if ($items_balance <= 0) {
        return "Your items are fully paid.\nShipping fee{$to_pay}: {$fee}\n";
    }
    return 'Balance: ' . peso_text($items_balance) . ' (total ' . peso_text($amounts['itemsTotal']) . ', paid ' . peso_text($amounts['paid']) . ")\n"
        . "Shipping fee: {$fee}\n"
        . ($to_pay ? 'Total to pay: ' : 'Total: ') . peso_text($amounts['balance']) . "\n";
}

// The Pay online link and what happens next (nothing to pay: just that it ships soon; a payment being checked:
// that we have it, and a link to the order history, where the customer sees "Payment sent · Being checked")
function delivery_pay_text(array $config, int $order_id, array $amounts): string
{
    if ($amounts['balance'] <= 0) {
        return "We will ship your order soon and email you the tracking number.\n";
    }
    if ($amounts['balanceSubmitted']) {
        return 'We received your payment of ' . peso_text($amounts['balanceSubmitted']['amount'])
            . " and are checking it. We will ship your order and email you the tracking number once it is confirmed.\n"
            . 'See your order: ' . rtrim($config['frontend_url'], '/') . "/profile?tab=orders\n";
    }
    return 'Pay online here: ' . pay_link($config, $order_id) . "\n"
        . "We check your payment, then ship your order and email you the tracking number.\n";
}

// Courier: LBC / Tracking number: ... / Track your parcel: (the courier's website, when we know it)
function tracking_text(string $courier, string $tracking): string
{
    $text = "Courier: {$courier}\nTracking number: {$tracking}\n";
    $site = courier_site($courier);
    if ($site) {
        $text .= "Track your parcel: {$site}\n";
    }
    return $text;
}

// "We received your payment of ₱5,779.30 (GCash) for the balance and shipping fee. Your order is fully paid."
// $payment: ['service' => ..., 'amount' => ...]; $amounts from order_amounts() (says what the payment was for)
function payment_received_text(array $payment, array $amounts): string
{
    $had_balance = round($amounts['itemsTotal'] - $amounts['downpayment'], 2) > 0;
    $had_fee = ($amounts['shippingFee'] ?? 0) > 0;
    $for = $had_balance && $had_fee ? 'the balance and shipping fee' : ($had_fee ? 'the shipping fee' : 'the balance');
    return 'We received your payment of ' . peso_text($payment['amount']) . ' (' . service_name($payment['service']) . ") for {$for}. Your order is fully paid.\n";
}

// A payment's name in the emails: InstaPay or Cash (helpers/payments.php)
function service_name(string $service): string
{
    return payment_service_name($service);
}

// The customer of an order: email, first_name, username (or null when the order is not found)
function order_customer(PDO $pdo, int $order_id): ?array
{
    $stmt = $pdo->prepare('SELECT u.email, u.first_name, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?');
    $stmt->execute([$order_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// Emails the customer and writes it to the Logs page ("<what> notification sent to ..." or "Failed to send ...").
// Returns true (sent), false (the mailer failed) or null (not sent: the walk-in account has no real inbox).
function notify_customer(PDO $pdo, string $admin_username, int $order_id, array $customer, string $what, string $subject, string $text): ?bool
{
    if ($customer['username'] === 'walkin_guest') {
        return null;
    }
    $sent = send_mail($customer['email'], $subject, $text, '/send-order-notification');
    if ($sent) {
        log_action($pdo, $admin_username, 'Email Notification', "{$what} notification sent to {$customer['email']} for Order #{$order_id}");
    } else {
        log_action($pdo, $admin_username, 'Email Notification Failed', "Failed to send {$what} notification to {$customer['email']} for Order #{$order_id}");
    }
    return $sent;
}

// Added to the admin's "Saved" message: whether the customer was emailed
function email_note(?bool $sent, string $when_sent): string
{
    if ($sent === null) {
        return '';
    }
    return $sent
        ? " {$when_sent}"
        : ' The email to the customer could not be sent. Check that the mailer is running, or contact the customer yourself.';
}
