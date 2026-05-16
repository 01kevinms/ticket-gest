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

$db       = read_db();
$tickets  = $db['tickets'] ?? [];
$filtered = array_values(array_filter($tickets, fn($t) => $t['id'] !== $id));

if (count($filtered) === count($tickets)) {
    respond_error(404, "Ticket {$id} não encontrado.");
}

$db['tickets'] = $filtered;
write_db($db);

respond_ok(null, "Ticket {$id} excluído.");
