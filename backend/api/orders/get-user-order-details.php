<?php
session_start();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/payments.php'; // order_amounts()

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

if (!isset($_GET['order_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Order ID is required']);
    exit;
}

$user_id = $_SESSION['user_id'];
$order_id = intval($_GET['order_id']);

try {
    // Fetch order details with customer and payment info - only for the logged-in user
    $stmt = $pdo->prepare('
        SELECT o.*, u.username, u.email, u.first_name, u.last_name, pay.reference_number, pay.service, pay.mobile, pay.amount, pay.uploaded_at
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN payments pay ON o.payment_id = pay.id
        WHERE o.id = ? AND o.user_id = ? AND o.deleted = 0
    ');
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }

    // Fetch order items with product details
    $item_stmt = $pdo->prepare('
        SELECT oi.*, p.name as product_name, p.description as product_description, p.image as product_image, p.type as product_type
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    ');
    $item_stmt->execute([$order_id]);
    $items = $item_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate total
    $total = 0;
    foreach ($items as $item) {
        $total += $item['price_at_purchase'] * $item['quantity'];
    }

    // Downpayment + balance (if recorded at pickup) and what is still owed
    $amounts = order_amounts($pdo, $order_id);

    // The status color and wording are decided by the website (frontend/src/utils/orderStatus.js)
    $currentStatus = $order['status'] ?? 'pending';

    // Prepare response
    $response = [
        'order' => [
            'id' => $order['id'],
            'date_ordered' => $order['date_ordered'],
            'date_completed' => $order['date_completed'],
            'status' => $currentStatus,
            'reference_number' => $order['reference_number'],
            'service' => $order['service']
        ],
        'customer' => [
            'name' => $order['first_name'] . ' ' . $order['last_name'],
            'email' => $order['email'] ?? 'N/A',
            'mobile' => $order['mobile'] ?? 'N/A'
        ],
        'products' => array_map(function($item) {
            return [
                'id' => $item['product_id'],
                'name' => $item['product_name'],
                'description' => $item['product_description'],
                'image' => $item['product_image'],
                'type' => $item['product_type'],
                'quantity' => $item['quantity'],
                'price' => $item['price_at_purchase'],
                'total' => $item['price_at_purchase'] * $item['quantity']
            ];
        }, $items),
        'payment' => [
            'reference_number' => $order['reference_number'],
            'service' => $order['service'],
            'amount' => $order['amount'],
            'uploaded_at' => $order['uploaded_at'],
            'mobile' => $order['mobile']
        ],
        'total' => $total,
        // The balance paid at pickup ({service, reference_number, amount, uploaded_at}) or null, and what is still owed
        'balance_payment' => $amounts['balancePayment'],
        'balance' => $currentStatus === 'cancelled' ? 0 : $amounts['balance'], // nothing more to pay on a cancelled order
        'can_cancel' => in_array($currentStatus, ['pending', 'processing', 'confirmed', 'waiting_for_buyer'])
    ];

    header('Content-Type: application/json');
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('get-user-order-details.php database error: ' . $e->getMessage()); // details for the server log only
    echo json_encode(['error' => 'Database error. Please try again.']);
}
?> 