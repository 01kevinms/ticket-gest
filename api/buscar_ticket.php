<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
if ($id === '') {
    respond_error(400, 'Parâmetro id é obrigatório.');
}

$db     = read_db();
$ticket = null;
foreach ($db['tickets'] ?? [] as $t) {
    if ($t['id'] === $id) {
        $ticket = $t;
        break;
    }
}

if (!$ticket) {
    respond_error(404, "Ticket {$id} não encontrado.");
}

respond_ok($ticket);
