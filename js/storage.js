/**
 * storage.js — TicketMS Data Layer v3
 * ─────────────────────────────────────────────────────────────
 * Modo localStorage SÍNCRONO para uso sem servidor PHP.
 * API-ready: se houver token + servidor, usa endpoints em api/.
 *
 * REGRA: todos os métodos públicos retornam valores diretos
 * (não Promise) quando operam no localStorage, para que o
 * restante do código possa chamar Storage.getTickets() sem await.
 *
 * Quando a API está disponível, os mesmos métodos retornam
 * Promises — os módulos que precisarem de dados da API devem
 * usar .then() ou async/await nesses casos.
 */

const Storage = (() => {

  // ═══════════════════════════════════════════════════════
  // CONFIGURAÇÃO
  // ═══════════════════════════════════════════════════════

  const API_DIR     = 'api';
  const API_TIMEOUT = 8000;
  const LS_KEYS     = { tickets: 'tms_tickets', clients: 'tms_clients' };
  const SS_KEY      = 'tms_session';

  // ═══════════════════════════════════════════════════════
  // SEED DATA
  // ═══════════════════════════════════════════════════════

  const SEED_CLIENTS = [
    { id: 'CLI001', name: 'Acme Soluções',  email: 'contato@acme.com.br', phone: '(11) 91234-5678', company: 'Acme Soluções LTDA',  createdAt: '2025-01-10' },
    { id: 'CLI002', name: 'NovaTech',       email: 'ti@novatech.io',       phone: '(21) 98765-4321', company: 'NovaTech Sistemas',   createdAt: '2025-01-18' },
    { id: 'CLI003', name: 'StartBR Labs',   email: 'ops@startbr.io',       phone: '(51) 93456-7890', company: 'StartBR Labs S.A.',  createdAt: '2025-02-05' },
    { id: 'CLI004', name: 'DataCore',       email: 'suporte@datacore.com', phone: '(31) 92345-6789', company: 'DataCore Analytics', createdAt: '2025-02-14' },
  ];

  const SEED_TICKETS = [
    { id: 'TK0001', title: 'Falha crítica no módulo de autenticação', description: 'Usuários são desconectados após 30s de sessão.', clientId: 'CLI001', priority: 'urgent', status: 'open',     assignee: 'Carlos Melo',  createdAt: '2025-04-01' },
    { id: 'TK0002', title: 'Dashboard carrega lentamente (> 8s)',     description: 'A tela principal demora mais de 8s para renderizar.', clientId: 'CLI002', priority: 'high',   status: 'progress', assignee: 'Ana Ribeiro',  createdAt: '2025-04-03' },
    { id: 'TK0003', title: 'Exportação de relatório PDF com erro',    description: 'Relatórios em PDF não incluem dados da última semana.', clientId: 'CLI001', priority: 'medium', status: 'resolved', assignee: 'Pedro Alves',  createdAt: '2025-04-05' },
    { id: 'TK0004', title: 'Integrar novo gateway de pagamento v3',   description: 'Cliente solicita migração para nova API do Pagar.me.',   clientId: 'CLI003', priority: 'high',   status: 'open',     assignee: 'Maria Costa',  createdAt: '2025-04-08' },
    { id: 'TK0005', title: 'Botão exportar CSV não responde',         description: 'Na tela de clientes o botão não dispara nenhuma ação.', clientId: 'CLI004', priority: 'low',    status: 'closed',   assignee: 'Carlos Melo',  createdAt: '2025-04-10' },
    { id: 'TK0006', title: 'Atualizar CNPJ e endereço no cadastro',   description: 'Cliente solicitou atualização dos dados fiscais.',       clientId: 'CLI002', priority: 'low',    status: 'resolved', assignee: 'Ana Ribeiro',  createdAt: '2025-04-12' },
    { id: 'TK0007', title: 'App fecha ao abrir push notification',    description: 'Aplicativo fecha ao tocar em qualquer notificação.',     clientId: 'CLI003', priority: 'urgent', status: 'progress', assignee: 'Pedro Alves',  createdAt: '2025-04-14' },
    { id: 'TK0008', title: 'Perfil gestor sem acesso a relatórios',   description: 'Usuários com perfil Gestor não acessam relatórios.',    clientId: 'CLI004', priority: 'medium', status: 'open',     assignee: 'Maria Costa',  createdAt: '2025-04-16' },
  ];

  // ═══════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════

  let _apiAvailable = null;

  // ═══════════════════════════════════════════════════════
  // SESSÃO (síncrono)
  // ═══════════════════════════════════════════════════════

  const getSession   = ()  => { try { return JSON.parse(sessionStorage.getItem(SS_KEY)); } catch { return null; } };
  const setSession   = obj => sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  const clearSession = ()  => sessionStorage.removeItem(SS_KEY);
  const _hasApiToken = ()  => !!(getSession()?.token);

  // ═══════════════════════════════════════════════════════
  // HELPERS localStorage (todos SÍNCRONOS)
  // ═══════════════════════════════════════════════════════

  const _lsRead  = key => { try { return JSON.parse(localStorage.getItem(LS_KEYS[key])) || []; } catch { return []; } };
  const _lsWrite = (key, data) => localStorage.setItem(LS_KEYS[key], JSON.stringify(data));
  const _today   = () => new Date().toISOString().split('T')[0];

  const _nextId = (prefix, list) => {
    const nums = list.map(i => parseInt(i.id.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return prefix + String(next).padStart(4, '0');
  };

  const _lsSeed = () => {
    if (!localStorage.getItem(LS_KEYS.clients)) _lsWrite('clients', SEED_CLIENTS);
    if (!localStorage.getItem(LS_KEYS.tickets)) _lsWrite('tickets', SEED_TICKETS);
  };

  // ═══════════════════════════════════════════════════════
  // HELPERS API (assíncronos — só usados quando há token)
  // ═══════════════════════════════════════════════════════

  const _url = (endpoint, params = {}) => {
    const all = { ...params };
    const s = getSession();
    if (s?.token) all.token = s.token;
    const qs = new URLSearchParams(all).toString();
    return `${API_DIR}/${endpoint}${qs ? '?' + qs : ''}`;
  };

  const _authHeaders = () => {
    const s = getSession();
    return s?.token ? { 'X-Session-Token': s.token } : {};
  };

  const _fetch = (url, opts = {}) => {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
  };

  const _apiGet = async (endpoint, params = {}) => {
    const res  = await _fetch(_url(endpoint, params), { method: 'GET', headers: _authHeaders() });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || `Erro ${res.status}`);
    return json.data ?? null;
  };

  const _apiPost = async (endpoint, params = {}, body = null) => {
    const form = new FormData();
    const s = getSession();
    if (s?.token) form.append('token', s.token);
    if (body) Object.entries(body).forEach(([k, v]) => { if (v != null) form.append(k, String(v)); });
    const res  = await _fetch(_url(endpoint, params), { method: 'POST', headers: _authHeaders(), body: form });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || `Erro ${res.status}`);
    return json.data ?? null;
  };

  const _pingApi = async () => {
    if (_apiAvailable !== null) return _apiAvailable;
    try {
      const res = await _fetch('api.php', { method: 'GET' });
      _apiAvailable = res.ok;
    } catch { _apiAvailable = false; }
    setTimeout(() => { _apiAvailable = null; }, 30_000);
    return _apiAvailable;
  };

  // ═══════════════════════════════════════════════════════
  // INIT / SEED
  // ═══════════════════════════════════════════════════════

  const seed = async () => {
    _lsSeed();
    const online = await _pingApi();
    const token  = _hasApiToken();
    console.info(`[Storage] Servidor: ${online ? '✅ online' : '❌ offline'} | Token: ${token ? '✅ presente' : '⚠️ ausente (modo local)'}`);
    return online && token;
  };

  // ═══════════════════════════════════════════════════════
  // TICKETS — SÍNCRONOS (localStorage)
  // Se quiser usar API no futuro, troque por versões async.
  // ═══════════════════════════════════════════════════════

  const getTickets = () => _lsRead('tickets');

  const getTicket = id => _lsRead('tickets').find(t => t.id === id) || null;

  const addTicket = data => {
    const list = _lsRead('tickets');
    const t = { ...data, id: _nextId('TK', list), createdAt: _today() };
    _lsWrite('tickets', [t, ...list]);
    return t;
  };

  const updateTicket = (id, data) => {
    const list = _lsRead('tickets').map(t => t.id === id ? { ...t, ...data } : t);
    _lsWrite('tickets', list);
    return list.find(t => t.id === id);
  };

  const deleteTicket = id => {
    _lsWrite('tickets', _lsRead('tickets').filter(t => t.id !== id));
    return true;
  };

  // ═══════════════════════════════════════════════════════
  // CLIENTS — SÍNCRONOS (localStorage)
  // ═══════════════════════════════════════════════════════

  const getClients = () => _lsRead('clients');

  const getClient = id => _lsRead('clients').find(c => c.id === id) || null;

  const addClient = data => {
    const list = _lsRead('clients');
    const c = { ...data, id: _nextId('CLI', list), createdAt: _today() };
    _lsWrite('clients', [c, ...list]);
    return c;
  };

  const updateClient = (id, data) => {
    const list = _lsRead('clients').map(c => c.id === id ? { ...c, ...data } : c);
    _lsWrite('clients', list);
    return list.find(c => c.id === id);
  };

  const deleteClient = id => {
    _lsWrite('clients', _lsRead('clients').filter(c => c.id !== id));
    return true;
  };

  const getTicketsByClient = clientId => _lsRead('tickets').filter(t => t.clientId === clientId);

  // ═══════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════

  const login = async (username, password) => {
    // Tenta API se disponível
    try {
      const online = await _pingApi();
      if (online) {
        const data = await _apiPost('login.php', {}, { username, password });
        setSession(data);
        console.info('[Storage] Login via API ✅');
        return { ok: true, session: data };
      }
    } catch (err) {
      if (err.message && !err.message.toLowerCase().includes('offline')) {
        return { ok: false, message: err.message };
      }
    }

    // Fallback local (sem token → localStorage)
    console.warn('[Storage] Login offline → dados do localStorage');
    const LOCAL_USERS = { admin: { password: 'admin', role: 'Administrador', display: 'Admin' } };
    const user = LOCAL_USERS[username?.toLowerCase()];
    if (user && user.password === password) {
      const session = { token: null, username, display: user.display, role: user.role };
      setSession(session);
      return { ok: true, session };
    }
    return { ok: false, message: 'Usuário ou senha incorretos.' };
  };

  const logout = async () => {
    const session = getSession();
    if (session?.token) {
      try { await _apiPost('logout.php'); } catch { /* ignora */ }
    }
    clearSession();
    window.location.href = 'login.html';
  };

  // ═══════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════

  return {
    seed,
    // Tickets
    getTickets, getTicket, addTicket, updateTicket, deleteTicket,
    // Clients
    getClients, getClient, addClient, updateClient, deleteClient, getTicketsByClient,
    // Auth
    login, logout,
    getSession, setSession, clearSession,
  };
})();
