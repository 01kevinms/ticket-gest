<?php
require '../helpers/cors.php';
require '../helpers/db.php';
require '../helpers/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error(405, 'Método não permitido. Use POST.');
}

$body = get_body();
require_fields($body, ['username', 'password']);

$username = strtolower(trim($body['username']));
$password = $body['password'];

$db    = read_db();
$users = $db['users'] ?? [];

$user = null;
foreach ($users as $u) {
    if (strtolower($u['username']) === $username) {
        $user = $u;
        break;
    }
}

if (!$user || $user['password'] !== $password) {
    respond_error(401, 'Usuário ou senha incorretos.');
}

$token    = generate_token();
$now      = time();
$sessions = $db['sessions'] ?? [];

// Limpa sessões expiradas (> 8h)
$sessions = array_filter((array)$sessions, fn($s) => ($now - $s['createdAt']) < 28800);

$sessions[$token] = [
    'username'  => $username,
    'display'   => $user['display'],
    'role'      => $user['role'],
    'createdAt' => $now,
];

$db['sessions'] = $sessions;
write_db($db);

respond_ok([
    'token'    => $token,
    'username' => $username,
    'display'  => $user['display'],
    'role'     => $user['role'],
], 'Login realizado com sucesso.');
