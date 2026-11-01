<?php
// Sends an email through the Node mailer (mailer/server.js).
// Returns true if the mailer accepted the request, false if it failed.
// When it fails, the reason is written to the PHP error log (see the PHP terminal).
function send_mail(string $to, string $subject, string $text): bool
{
    $config = require __DIR__ . '/../config/app.php';
    $url = $config['mailer_url'] . '/send-reset';

    $context = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => 'Content-Type: application/json',
        'content'       => json_encode(['to' => $to, 'subject' => $subject, 'text' => $text]),
        'timeout'       => 10,
        'ignore_errors' => true, // lets us read the mailer's own error message
    ]]);

    $response = @file_get_contents($url, false, $context);

    // Case 1: the mailer could not be reached at all (not running, wrong port, blocked)
    if ($response === false) {
        $problem = error_get_last()['message'] ?? 'unknown error';
        error_log("send_mail: could not reach the mailer at $url ($problem)");
        return false;
    }

    // Case 2: the mailer answered, but with an error (for example Gmail refused the login)
    $headers = function_exists('http_get_last_response_headers')
        ? http_get_last_response_headers()
        : ($http_response_header ?? []);
    $status = $headers[0] ?? '';
    if (!preg_match('#^HTTP/\S+\s+2\d\d#', $status)) {
        error_log("send_mail: the mailer answered \"$status\": $response");
        return false;
    }

    return true;
}