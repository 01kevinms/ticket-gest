<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

$db      = read_db();
$clients = $db['clients'] ?? [];

usort($clients, fn($a, $b) => strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? ''));

respond_ok($clients);
