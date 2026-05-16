<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

require_auth();

$db      = read_db();
$tickets = $db['tickets'] ?? [];

usort($tickets, fn($a, $b) => strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? ''));

respond_ok($tickets);
