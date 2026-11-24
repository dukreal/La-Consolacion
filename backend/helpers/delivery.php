<?php
// Store pickup or delivery by courier (LBC or another courier), and the delivery address.
// Used by checkout (api/orders/payment.php), the saved address (api/users/save-address.php, get-profile.php),
// the order details for the customer and the admin, and the status emails.
//
// An address has the same keys everywhere: name, mobile, street, barangay, city, province, zip, notes.
// In the database they are orders.delivery_<key> (copied at checkout) and users.address_<key> (saved for next time).

const FULFILLMENTS = ['pickup', 'delivery'];

// The longest each field may be (the database columns), and whether it must be filled in
const ADDRESS_FIELDS = [
    'name'     => ['max' => 150, 'required' => true,  'label' => 'Recipient name'],
    'mobile'   => ['max' => 11,  'required' => true,  'label' => 'Mobile number'],
    'street'   => ['max' => 255, 'required' => true,  'label' => 'House no., street, subdivision'],
    'barangay' => ['max' => 100, 'required' => true,  'label' => 'Barangay'],
    'city'     => ['max' => 100, 'required' => true,  'label' => 'City / Municipality'],
    'province' => ['max' => 100, 'required' => true,  'label' => 'Province'],
    'zip'      => ['max' => 4,   'required' => true,  'label' => 'ZIP code'],
    'notes'    => ['max' => 255, 'required' => false, 'label' => 'Landmark or notes'],
];

// Reads an address from a form, e.g. read_address($_POST, 'delivery_') for delivery_name, delivery_mobile, ...
// Returns [address, errors]: the cleaned-up address and a list of messages (empty when it is fine).
function read_address(array $source, string $prefix = ''): array
{
    $address = [];
    $errors = [];
    foreach (ADDRESS_FIELDS as $key => $field) {
        $value = $source[$prefix . $key] ?? '';
        $value = is_string($value) ? trim(preg_replace('/\s+/u', ' ', $value)) : '';
        if ($key === 'mobile') {
            $value = preg_replace('/\D/', '', $value);
        }
        if ($value === '' && $field['required']) {
            $errors[] = "{$field['label']} is required.";
        } elseif (mb_strlen($value) > $field['max']) {
            $errors[] = "{$field['label']} is too long (at most {$field['max']} characters).";
        }
        $address[$key] = $value === '' ? null : $value;
    }
    if ($address['mobile'] !== null && !preg_match('/^09\d{9}$/', $address['mobile'])) {
        $errors[] = 'Mobile number must be 11 digits and start with 09.';
    }
    if ($address['zip'] !== null && !preg_match('/^\d{4}$/', $address['zip'])) {
        $errors[] = 'ZIP code must be 4 digits.';
    }
    return [$address, $errors];
}

// The address stored in a row under a prefix ('delivery_' for orders, 'address_' for users), or null when empty
function address_from_row(array $row, string $prefix): ?array
{
    $address = [];
    foreach (array_keys(ADDRESS_FIELDS) as $key) {
        $address[$key] = $row[$prefix . $key] ?? null;
    }
    return $address['street'] === null ? null : $address;
}

// "name = ?, mobile = ?, ..." for an UPDATE, and the values in the same order
function address_columns(string $prefix): array
{
    return array_map(fn ($key) => $prefix . $key, array_keys(ADDRESS_FIELDS));
}

// The address as lines of text, for the emails and the admin's Copy address button:
//   Maria Santos · 09171234567
//   12 Rizal St., Brgy. Carmen
//   Cagayan de Oro, Misamis Oriental 9000
//   Landmark/notes: blue gate beside the chapel
function address_text(array $a): string
{
    $lines = [
        "{$a['name']} · {$a['mobile']}",
        "{$a['street']}, Brgy. " . preg_replace('/^(brgy\.?|barangay)\s*/i', '', (string) $a['barangay']),
        "{$a['city']}, {$a['province']} {$a['zip']}",
    ];
    if (!empty($a['notes'])) {
        $lines[] = "Landmark/notes: {$a['notes']}";
    }
    return implode("\n", $lines);
}
