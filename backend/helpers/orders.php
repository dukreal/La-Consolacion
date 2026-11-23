<?php
// How an order is named for customers: "LCJ-0951" instead of the database number (#951).
// The website shows the same (frontend/src/utils/orderRef.js), so a customer can quote it from an email or
// their order history; the admin pages keep the plain number (LCJ-0951 is order #951).
function order_ref($order_id): string
{
    return 'LCJ-' . str_pad((string) (int) $order_id, 4, '0', STR_PAD_LEFT);
}
