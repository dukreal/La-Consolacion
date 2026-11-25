<?php
// Saves a product picture sent from an admin form (Add/Edit Premade, Add/Edit Custom),
// and a payment screenshot for paying the rest online (save_payment_screenshot, at the end).
// Same file types as the old forms: JPG, PNG, GIF, WEBP, up to 10MB.
// On a bad file it answers with a JSON error and stops, so callers only get a good file name back.
require_once __DIR__ . '/json.php';

const IMAGE_ERROR = 'Invalid image type or size. Use PNG, JPG, GIF or WEBP under 10MB.';

// A file bigger than PHP's post_max_size makes PHP throw away the whole form ($_POST is empty).
// Call this first in endpoints that take a picture.
function reject_oversized_post(): void
{
    if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        json_response(['success' => false, 'error' => IMAGE_ERROR], 413);
    }
}

// Was a picture sent in this field? (an empty file input sends UPLOAD_ERR_NO_FILE)
function has_upload(string $field): bool
{
    return isset($_FILES[$field]) && $_FILES[$field]['error'] !== UPLOAD_ERR_NO_FILE;
}

// $folder: 'products' or 'custom' (inside backend/uploads). $prefix: start of the new file name.
// Returns the new file name, which is what the products.image column stores.
function save_product_image(string $field, string $folder, string $prefix): string
{
    $file = $_FILES[$field];
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 10 * 1024 * 1024) {
        json_response(['success' => false, 'error' => IMAGE_ERROR], 422);
    }

    // Look at the real file, not the name the browser sent
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
    $info = @getimagesize($file['tmp_name']);
    if (!$info || !isset($types[$info[2]])) {
        json_response(['success' => false, 'error' => IMAGE_ERROR], 422);
    }

    $dir = __DIR__ . '/../uploads/' . $folder . '/';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    $name = $prefix . '_' . uniqid() . '.' . $types[$info[2]];
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) {
        json_response(['success' => false, 'error' => 'Image upload failed.'], 500);
    }
    return $name;
}

// Keeps only letters and numbers, for building file names like the old code did
function slug(string $text): string
{
    return preg_replace('/[^a-z0-9]/', '', strtolower($text));
}

// Saves an e-wallet payment screenshot (paying the rest online: api/orders/pay-balance.php), with the same rules as
// the checkout (api/orders/payment.php): PNG, JPG or GIF, up to 10MB, in uploads/payments.
// Returns the new file name (payments.image); on a bad or missing file it answers with a JSON error and stops.
function save_payment_screenshot(string $field): string
{
    $error = 'Invalid file type or size. Use PNG, JPG, or GIF under 10MB.';
    $file = $_FILES[$field] ?? null;
    if ($file && in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        json_response(['success' => false, 'error' => $error], 422);
    }
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
        json_response(['success' => false, 'error' => 'Please upload a payment screenshot.'], 422);
    }
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif'];
    $info = @getimagesize($file['tmp_name']); // the real file, not the name the browser sent
    if ($file['size'] > 10 * 1024 * 1024 || !$info || !isset($types[$info[2]])) {
        json_response(['success' => false, 'error' => $error], 422);
    }
    $dir = __DIR__ . '/../uploads/payments/';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    $name = uniqid('payment_', true) . '.' . $types[$info[2]];
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) {
        json_response(['success' => false, 'error' => 'Failed to save uploaded file.'], 500);
    }
    return $name;
}
