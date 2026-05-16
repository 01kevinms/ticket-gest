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
$clients  = $db['clients'] ?? [];
$filtered = array_values(array_filter($clients, fn($c) => $c['id'] !== $id));

if (count($filtered) === count($clients)) {
    respond_error(404, "Cliente {$id} não encontrado.");
}

$db['clients'] = $filtered;
write_db($db);

respond_ok(null, "Cliente {$id} excluído.");
