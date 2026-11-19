<?php
// Reads and checks the fields of the Add Premade / Edit Product forms.
// The old pages only had the browser's "required" checks; these are the same rules done on the server.
require_once __DIR__ . '/json.php';

const PREMADE_TYPES = ['ring', 'charm', 'earring', 'bracelet'];

// Returns ['name', 'price', 'stock', 'type', 'material', 'description'] or answers with an error.
function read_premade_fields(): array
{
    $fields = [
        'name'        => trim($_POST['itemName'] ?? ''),
        'price'       => trim($_POST['itemPrice'] ?? ''),
        'stock'       => trim($_POST['itemStock'] ?? ''),
        'type'        => strtolower(trim($_POST['itemType'] ?? '')),
        'material'    => trim($_POST['itemMaterial'] ?? ''),
        'description' => trim($_POST['itemDescription'] ?? ''),
    ];

    if ($fields['name'] === '') {
        json_response(['success' => false, 'error' => 'Product name is required.'], 422);
    }
    if (!is_numeric($fields['price']) || $fields['price'] < 0) {
        json_response(['success' => false, 'error' => 'Price must be a positive number.'], 422);
    }
    check_stock($fields['stock']);
    if (!in_array($fields['type'], PREMADE_TYPES, true)) {
        json_response(['success' => false, 'error' => 'Please select a product type.'], 422);
    }

    $fields['price'] = (float) $fields['price'];
    $fields['stock'] = (int) $fields['stock'];
    return $fields;
}

// Stock must be a whole number, 0 or more
function check_stock(string $stock): void
{
    if (!preg_match('/^\d+$/', $stock)) {
        json_response(['success' => false, 'error' => 'Stock must be a positive number.'], 422);
    }
}

const CUSTOM_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

// Fields of the Add Custom Order / Edit Custom Order forms (same rules and messages as the old pages).
// Returns ['customer_name', 'email', 'product_name', 'price', 'stock', 'description'] or answers with an error.
function read_custom_fields(): array
{
    $fields = [
        'customer_name' => trim($_POST['customerName'] ?? ''),
        'email'         => trim($_POST['customerEmail'] ?? ''),
        'product_name'  => trim($_POST['productName'] ?? ''),
        'price'         => trim($_POST['customPrice'] ?? ''),
        'stock'         => trim($_POST['stock'] ?? '1'),
        'description'   => trim($_POST['customDescription'] ?? ''),
    ];

    foreach (['customer_name', 'email', 'product_name', 'price', 'description'] as $key) {
        if ($fields[$key] === '') {
            json_response(['success' => false, 'error' => 'All fields except image are required.'], 422);
        }
    }
    if (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'error' => 'Invalid email address.'], 422);
    }
    if (!is_numeric($fields['price']) || $fields['price'] < 0) {
        json_response(['success' => false, 'error' => 'Price must be a positive number.'], 422);
    }
    check_stock($fields['stock']);

    $fields['price'] = (float) $fields['price'];
    $fields['stock'] = (int) $fields['stock'];
    return $fields;
}
