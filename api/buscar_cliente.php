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
$client = null;
foreach ($db['clients'] ?? [] as $c) {
    if ($c['id'] === $id) {
        $client = $c;
        break;
    }
}

if (!$client) {
    respond_error(404, "Cliente {$id} não encontrado.");
}

respond_ok($client);
