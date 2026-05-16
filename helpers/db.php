<?php
/**
 * helpers/db.php — Leitura e escrita do db.json
 *
 * O db.json fica sempre na raiz do projeto (um nível acima de helpers/).
 * Usamos dirname(__FILE__) para montar o caminho absoluto corretamente,
 * independente de qual subpasta chama este arquivo.
 */

define('DB_FILE', dirname(__FILE__) . '/../db.json');

function read_db(): array
{
    if (!file_exists(DB_FILE)) {
        return ['tickets' => [], 'clients' => [], 'users' => [], 'sessions' => []];
    }
    $raw = file_get_contents(DB_FILE);
    if ($raw === false || trim($raw) === '') {
        return ['tickets' => [], 'clients' => [], 'users' => [], 'sessions' => []];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : ['tickets' => [], 'clients' => [], 'users' => [], 'sessions' => []];
}

function write_db(array $db): bool
{
    $tmp = DB_FILE . '.tmp';
    $ok  = file_put_contents($tmp, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($ok === false) return false;
    return rename($tmp, DB_FILE);
}
