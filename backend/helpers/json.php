<?php
// Small helpers shared by the JSON endpoints.

// Sends a JSON response and stops the script.
function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Reads the JSON body that React sends with fetch().
function read_json(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}