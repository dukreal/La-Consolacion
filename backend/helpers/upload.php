<?php
// Saves a product picture sent from an admin form (Add/Edit Premade, Add/Edit Custom).
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
