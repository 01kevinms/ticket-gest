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
$clients = $db['clients'] ?? [];
$idx     = array_search($id, array_column($clients, 'id'));

if ($idx === false) {
    respond_error(404, "Cliente {$id} não encontrado.");
}

$body   = get_body();
$clean  = sanitize_client(array_merge($clients[$idx], $body));
$client = array_merge($clients[$idx], $clean);
$clients[$idx] = $client;

$db['clients'] = $clients;
write_db($db);

respond_ok($client, 'Cliente atualizado.');
