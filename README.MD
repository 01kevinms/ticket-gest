
# 🎫 TicketMS — Sistema de Gerenciamento de Tickets

Sistema de suporte e controle de chamados técnicos com painel de métricas, gestão de clientes e tickets por prioridade e status. Desenvolvido com HTML, CSS e JavaScript puro no frontend, e PHP + JSON como backend leve — sem frameworks, sem dependências externas.

---

## 🔐 Acesso

| Campo    | Valor   |
|----------|---------|
| Usuário  | `admin` |
| Senha    | `admin` |

---

## ✨ Funcionalidades

- **Dashboard** — contadores de tickets abertos, em andamento, resolvidos e fechados; listagem das últimas movimentações com badge de status e prioridade
- **Tickets** — cadastro, edição, exclusão, troca de status e filtros por status, prioridade e busca textual; visualização detalhada em modal
- **Clientes** — cadastro e edição de clientes, histórico de tickets por cliente
- **Relatórios** — taxa de resolução, breakdown por status e prioridade, ranking de clientes por volume, desempenho por responsável (assignee)
- **Autenticação** — login com sessão via `sessionStorage`; no modo API, token é gerado e armazenado no `db.json` com expiração de 8h

---

## 🗂 Estrutura do Projeto

```
ticketms/
├── index.html          # Dashboard principal
├── ticket.html         # Lista de tickets
├── clients.html        # Lista de clientes
├── reports.html        # Relatórios e métricas
├── login.html
│
├── css/
│   └── style.css       # Design system completo (dark theme, tokens CSS)
│
├── js/
│   ├── storage.js      # Camada de dados (localStorage síncrono + API-ready)
│   ├── auth.js         # Autenticação e proteção de rotas
│   ├── dashboard.js    # Shell do app, navegação, sidebar e dashboard
│   ├── tickets.js      # Página de tickets
│   ├── ticket.js       # Detalhe / modal de ticket
│   ├── clients.js      # Página de clientes
│   ├── client.js       # Detalhe de cliente
│   ├── reports.js      # Relatórios e métricas
│   ├── modal.js        # Sistema de modais
│   └── script.js       # Inicialização geral
│
├── api/                # Endpoints PHP individuais
│   ├── login.php
│   ├── logout.php
│   ├── listar_tickets.php
│   ├── buscar_ticket.php
│   ├── criar_ticket.php
│   ├── atualizar_ticket.php
│   ├── deletar_ticket.php
│   ├── tickets_por_cliente.php
│   ├── listar_clientes.php
│   ├── buscar_cliente.php
│   ├── criar_cliente.php
│   ├── atualizar_cliente.php
│   └── deletar_cliente.php
│
├── helpers/
│   ├── db.php          # Leitura e escrita do db.json (thread-safe com .tmp)
│   ├── cors.php        # Headers CORS e preflight
│   └── utils.php       # respond_ok(), respond_error(), get_body(), generate_token()
│
├── api.php             # Roteador alternativo monolítico (legado)
└── db.json             # Banco de dados em JSON
```

---

## 🚀 Como Rodar

### Opção 1 — Live Server (sem PHP)

Abra o projeto com a extensão **Live Server** do VS Code ou qualquer servidor estático.

O `storage.js` usa `localStorage` automaticamente — os dados de seed (4 clientes e 8 tickets de exemplo) são carregados na primeira abertura. Nenhuma configuração necessária.

> Dados cadastrados nesse modo ficam salvos no navegador (localStorage).

### Opção 2 — Servidor PHP (XAMPP, Laragon, php -S)

```bash
# Na pasta do projeto:
php -S localhost:8000
```

Acesse `http://localhost:8000/login.html`.

Nesse modo, os dados são lidos e gravados diretamente no `db.json` via endpoints PHP da pasta `api/`. O login gera um token de sessão armazenado em `db.json` com validade de 8 horas.

> Certifique-se de que o `db.json` tem permissão de escrita:
> ```bash
> chmod 664 db.json
> ```

---

## ⚙️ Como Funciona o Storage

O `storage.js` opera em modo **síncrono com localStorage** por padrão, sem necessidade de servidor. A camada de API fica disponível quando há token de sessão e servidor PHP ativo:

```
Login
  │
  ├── Servidor PHP disponível? ──► MODO API
  │                                Dados lidos/gravados em db.json
  │                                Token gerado com expiração 8h
  │
  └── Sem PHP (Live Server) ──────► MODO LOCAL
                                    localStorage + seed automático
                                    Todos os métodos síncronos
```

Todos os métodos públicos (`getTickets()`, `getClients()`, etc.) retornam valores diretos — não Promises — no modo local, o que elimina a necessidade de `await` no restante do código.

---

## 🏷 Status e Prioridades

**Status dos tickets:**

| Status       | Descrição              |
|--------------|------------------------|
| `open`       | Aberto — aguardando    |
| `progress`   | Em andamento           |
| `resolved`   | Resolvido              |
| `closed`     | Fechado                |

**Prioridades:**

| Prioridade | Nível         |
|------------|---------------|
| `low`      | ↓ Baixa       |
| `medium`   | → Média        |
| `high`     | ↑ Alta         |
| `urgent`   | 🔴 Urgente     |

---

## 🛠 Tecnologias

| Camada          | Tecnologia                        |
|-----------------|-----------------------------------|
| Frontend        | HTML5, CSS3, JavaScript ES2020+   |
| Backend         | PHP 8+                            |
| Banco de dados  | JSON flat-file (`db.json`)        |
| Autenticação    | Token gerado server-side + `sessionStorage` |
| Persistência local | `localStorage`               |

---

## 📌 Observações Técnicas

- **Zero dependências** — nenhum npm, nenhum CDN, nenhum framework
- **Dark theme** com design system baseado em CSS custom properties
- **Escrita segura no db.json** — o `helpers/db.php` escreve em um arquivo `.tmp` e só então faz `rename()`, evitando corrupção em escritas concorrentes
- **Sessões com expiração** — tokens no `db.json` são limpos automaticamente após 8h a cada novo login
- **`api.php`** na raiz é um roteador monolítico legado; a pasta `api/` contém os endpoints individuais que estão ativamente em uso
- Dados do `db.json` são fictícios e destinados exclusivamente a demonstração