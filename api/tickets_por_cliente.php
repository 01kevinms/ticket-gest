<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

$clientId = isset($_GET['clientId']) ? trim($_GET['clientId']) : '';
if ($clientId === '') {
    respond_error(400, 'Parâmetro clientId é obrigatório.');
}

$db            = read_db();
$clientTickets = array_values(
    array_filter($db['tickets'] ?? [], fn($t) => $t['clientId'] === $clientId)
);

respond_ok($clientTickets);
