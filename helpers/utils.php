<?php
/**
 * helpers/utils.php — Funções auxiliares
 */

/**
 * Gera ID sequencial com prefixo.
 */
function next_id(string $prefix, array $list): string
{
    $nums = array_map(
        fn($item) => (int) preg_replace('/\D/', '', $item['id'] ?? '0'),
        $list
    );
    $next = count($nums) ? max($nums) + 1 : 1;
    return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
}

/**
 * Lê dados do POST (FormData ou JSON via stdin).
 */
function get_body(): array
{
    if (!empty($_POST)) {
        return $_POST;
    }
    $headers = getallheaders();
    if (isset($headers['Content-Type']) && strpos($headers['Content-Type'], 'application/json') !== false) {
        $data = json_decode($input, true);
        return is_array($data) ? $data : [];
    }
    return [];
}

/**
 * Valida campos obrigatórios; responde 422 se algum faltar.
 */
function require_fields(array $body, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($body[$f]) || (is_string($body[$f]) && trim($body[$f]) === '')) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => "Campo obrigatório ausente: {$f}"]);
            exit;
        }
    }
}

/**
 * Sanitiza campos de um ticket.
 */
function sanitize_ticket(array $data): array
{
    $allowed = ['title', 'description', 'clientId', 'priority', 'status', 'assignee'];
    $valid_p = ['low', 'medium', 'high', 'urgent'];
    $valid_s = ['open', 'progress', 'resolved', 'closed'];

    $out = [];
    foreach ($allowed as $k) {
        $out[$k] = isset($data[$k])
            ? htmlspecialchars(trim((string)$data[$k]), ENT_QUOTES, 'UTF-8')
            : '';
    }
    if (!in_array($out['priority'], $valid_p, true)) $out['priority'] = 'medium';
    if (!in_array($out['status'],   $valid_s, true)) $out['status']   = 'open';
    return $out;
}

/**
 * Sanitiza campos de um cliente.
 */
function sanitize_client(array $data): array
{
    $allowed = ['name', 'email', 'phone', 'company'];
    $out = [];
    foreach ($allowed as $k) {
        $out[$k] = isset($data[$k])
            ? htmlspecialchars(trim((string)$data[$k]), ENT_QUOTES, 'UTF-8')
            : '';
    }
    return $out;
}

/**
 * Extrai o token da requisição.
 * Aceita: header X-Session-Token, Authorization: Bearer <token>,
 * ou query string ?token=... como último recurso.
 */
function get_token_from_request(): ?string
{
    $headers = getallheaders();

    // Normaliza chaves para case-insensitive
    $normalized = [];
    foreach ($headers as $k => $v) {
        $normalized[strtolower($k)] = $v;
    }

    $h = $normalized['x-session-token']
      ?? $normalized['authorization']
      ?? $_GET['token']    // fallback via query string
      ?? $_POST['token']   // fallback via POST field
      ?? '';

    if (str_starts_with($h, 'Bearer ')) {
        $h = substr($h, 7);
    }
    return trim($h) !== '' ? trim($h) : null;
}

/**
 * Retorna a sessão ativa ou null se inválida/expirada.
 */
function get_session(): ?array
{
    $token = get_token_from_request();
    if (!$token) return null;

    $db       = read_db();
    $sessions = $db['sessions'] ?? [];
    $s        = $sessions[$token] ?? null;
    if (!$s) return null;

    // Token expira em 8h
    if ((time() - ($s['createdAt'] ?? 0)) > 28800) {
        unset($db['sessions'][$token]);
        write_db($db);
        return null;
    }
    return $s;
}

/**
 * Exige autenticação válida; responde 401 e encerra se não autenticado.
 */
function require_auth(): array
{
    $session = get_session();
    if (!$session) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'Não autenticado. Faça login novamente.']);
        exit;
    }
    return $session;
}

/**
 * Gera token aleatório seguro (48 hex chars).
 */
function generate_token(): string
{
    return bin2hex(random_bytes(24));
}

/**
 * Emite resposta JSON padronizada { ok, data?, message? } e encerra.
 */
function respond(int $code, mixed $data, string $message = ''): void
{
    http_response_code($code);
    $body = ['ok' => $code < 400];
    if ($message !== '')  $body['message'] = $message;
    if ($data !== null)   $body['data']    = $data;
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_ok(mixed $data = null, string $message = ''): void { respond(200, $data, $message); }
function respond_created(mixed $data = null): void                    { respond(201, $data, 'Criado com sucesso.'); }
function respond_error(int $code, string $message): void              { respond($code, null, $message); }
