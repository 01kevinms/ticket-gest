<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error(405, 'Método não permitido. Use POST.');
}

$body = get_body();
require_fields($body, ['title']);

$db      = read_db();
$tickets = $db['tickets'] ?? [];
$clean   = sanitize_ticket($body);
$ticket  = array_merge($clean, [
    'id'        => next_id('TK', $tickets),
    'createdAt' => date('Y-m-d'),
]);

array_unshift($tickets, $ticket);
$db['tickets'] = $tickets;
write_db($db);

respond_created($ticket);
