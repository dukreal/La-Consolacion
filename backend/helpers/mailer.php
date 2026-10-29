<?php
// Sends an email through the Node mailer (mailer/server.js).
// Returns true if the mailer accepted the request, false if it failed.
function send_mail(string $to, string $subject, string $text): bool
{
    $config = require __DIR__ . '/../config/app.php';

    $context = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => json_encode(['to' => $to, 'subject' => $subject, 'text' => $text]),
        'timeout' => 10,
    ]]);

    return @file_get_contents($config['mailer_url'] . '/send-reset', false, $context) !== false;
}