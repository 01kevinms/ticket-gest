<?php
/**
 * api.php — TicketMS ponto de entrada / ping
 * ─────────────────────────────────────────────────────────────
 * As rotas reais estão em api/ (uma por arquivo).
 * Este arquivo responde apenas ao ping de disponibilidade
 * usado pelo storage.js para detectar se a API está online.
 *
 * Estrutura:
 *   api/login.php              POST
 *   api/logout.php             POST
 *   api/listar_tickets.php     GET
 *   api/buscar_ticket.php      GET  ?id=TK0001
 *   api/criar_ticket.php       POST
 *   api/atualizar_ticket.php   POST ?id=TK0001
 *   api/deletar_ticket.php     POST ?id=TK0001
 *   api/listar_clientes.php    GET
 *   api/buscar_cliente.php     GET  ?id=CLI001
 *   api/criar_cliente.php      POST
 *   api/atualizar_cliente.php  POST ?id=CLI001
 *   api/deletar_cliente.php    POST ?id=CLI001
 *   api/tickets_por_cliente.php GET ?clientId=CLI001
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'ok'      => true,
    'version' => '2.0.0',
    'status'  => 'TicketMS API online',
]);
