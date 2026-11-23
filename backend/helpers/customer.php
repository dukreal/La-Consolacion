<?php
// Shared by the customer's order endpoints (api/orders/get-user-orders.php, get-user-order-details.php,
// cancel-order.php): the login check and which orders the customer may still cancel.
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/json.php';

// Orders the customer can still cancel. Completed and Cancelled are final.
// 'confirmed' is an old status some early orders may still have.
const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'processing', 'confirmed', 'waiting_for_buyer'];

function customer_can_cancel(string $status): bool
{
    return in_array($status, CUSTOMER_CANCELLABLE_STATUSES, true);
}

// Returns the logged-in customer's user id, or answers 401 and stops.
function require_customer(): int
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!isset($_SESSION['user_id'])) {
        json_response(['success' => false, 'error' => 'User not logged in'], 401);
    }
    return (int) $_SESSION['user_id'];
}
