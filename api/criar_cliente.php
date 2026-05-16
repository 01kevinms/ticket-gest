<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error(405, 'Método não permitido. Use POST.');
}

$body = get_body();
require_fields($body, ['name']);

$db      = read_db();
$clients = $db['clients'] ?? [];
$clean   = sanitize_client($body);
$client  = array_merge($clean, [
    'id'        => next_id('CLI', $clients),
    'createdAt' => date('Y-m-d'),
]);

array_unshift($clients, $client);
$db['clients'] = $clients;
write_db($db);

respond_created($client);
