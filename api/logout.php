<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error(405, 'Método não permitido. Use POST.');
}

$token = get_token_from_request();
if ($token) {
    $db = read_db();
    unset($db['sessions'][$token]);
    write_db($db);
}

respond_ok(null, 'Logout realizado.');
