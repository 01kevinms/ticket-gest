<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error(405, 'Método não permitido. Use POST.');
}

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
if ($id === '') {
    respond_error(400, 'Parâmetro id é obrigatório.');
}

$db      = read_db();
$tickets = $db['tickets'] ?? [];
$idx     = array_search($id, array_column($tickets, 'id'));

if ($idx === false) {
    respond_error(404, "Ticket {$id} não encontrado.");
}

$body   = get_body();
$clean  = sanitize_ticket(array_merge($tickets[$idx], $body));
$ticket = array_merge($tickets[$idx], $clean);
$tickets[$idx] = $ticket;

$db['tickets'] = $tickets;
write_db($db);

respond_ok($ticket, 'Ticket atualizado.');
