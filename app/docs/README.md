# Rental Marketplace — Documentação do Projeto

> **Data de início:** 28/05/2026
> **Stack:** Node.js/Fastify + Next.js + PostgreSQL + Redis + Docker
> **Objetivo:** MVP funcional em 8 semanas

---

## 1. ESTRUTURA DO PROJETO

```
app/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # Autenticação (register, login, me)
│   │   │   ├── products.js      # CRUD de produtos + busca com FTS
│   │   │   ├── rentals.js       # Reservas, pickup, return, QR Code
│   │   │   ├── reviews.js       # Avaliações (criar, listar, pendentes)
│   │   │   └── users.js         # Perfil, KYC, QR Code generate/validate
│   │   ├── services/
│   │   │   └── escrow.js        # Lógica de retenção/liberação de pagamento
│   │   └── index.js             # Entrypoint Fastify
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── database/
│   ├── init.sql                 # Schema completo do banco
│   └── seed.sql                 # Dados de exemplo
├── docs/
│   └── README.md                # Este arquivo
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js        # Layout raiz com AuthProvider + Nav
│   │   │   ├── page.js          # Home (catálogo + busca + filtros)
│   │   │   ├── login/page.js    # Login
│   │   │   ├── register/page.js # Cadastro
│   │   │   ├── profile/page.js  # Perfil + KYC + avaliações pendentes
│   │   │   ├── products/[id]/page.js  # Detalhe do produto + reserva
│   │   │   ├── products/new/page.js   # Criar anúncio
│   │   │   └── rentals/page.js  # Meus aluguéis + QR + avaliações
│   │   ├── components/
│   │   │   └── Nav.js           # Navbar responsiva
│   │   ├── context/
│   │   │   └── AuthContext.js   # Contexto de autenticação
│   │   └── lib/
│   │       └── api.js           # Cliente HTTP para API
│   ├── Dockerfile               # Multi-stage build
│   └── package.json
├── docker-compose.yml           # Orquestração (api + web + db + redis)
└── .env                         # Variáveis de ambiente
```

---

## 2. ARQUITETURA (Docker)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │   Redis      │
│  Next.js     │───▶│  Node.js     │◀──▶│  (cache)     │
│  porta :3001  │    │  porta :3000  │    │  porta :6379  │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  porta :5432  │
                    │  (host: 5433) │
                    └──────────────┘
                    Rede: marketplace_network
```

**Serviços Docker:**
| Serviço | Imagem | Porta host | Depende de |
|---------|--------|-----------|------------|
| `api` | Dockerfile (backend) | 3000 | db (healthy), redis |
| `web` | Dockerfile (frontend) | 3001 | api |
| `db` | postgres:15-alpine | 5433 | — |
| `redis` | redis:7-alpine | 6379 | — |

Comandos úteis:
```bash
docker compose up -d           # Sobe todos os serviços
docker compose down            # Derruba tudo
docker compose logs api -f     # Logs da API em tempo real
docker compose logs web -f     # Logs do frontend em tempo real
docker compose ps              # Status dos containers
docker exec -it app-db-1 psql -U rental_user -d rental_marketplace  # Acessar banco
```

---

## 3. BANCO DE DADOS (PostgreSQL)

**Extensões:** `pg_trgm` (suporte a busca textual)

**Enums:**
- `user_type`: owner, renter, both
- `rental_status`: active, completed, disputed, cancelled
- `transaction_status`: held, released, refunded, disputed
- `product_status`: available, rented, unavailable

**Tabelas:**

| Tabela | Descrição | 
|--------|-----------|
| `users` | Usuários (locadores e locatários) |
| `products` | Itens disponíveis para aluguel |
| `rentals` | Aluguéis ativos/completos |
| `transactions` | Pagamentos em Escrow |
| `reviews` | Avaliações bilaterais |
| `product_availability` | Disponibilidade por data |

**Full Text Search:**
- Coluna gerada `search_vector` (tsvector) em português
- Índice GIN para busca rápida
- Busca via `plainto_tsquery('portuguese', $termo)`

---

## 4. BACKEND (Fastify/Node.js)

### 4.1 Endpoints da API

#### Auth (`/api/auth`)
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/register` | ❌ | Cadastro (name, email, password) → user + JWT |
| POST | `/login` | ❌ | Login (email, password) → user + JWT |
| GET | `/me` | ✅ JWT | Dados do usuário logado |

#### Products (`/api/products`)
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/` | ❌ | Listar produtos disponíveis (com filtros) |
| GET | `/:id` | ❌ | Detalhes do produto |
| POST | `/` | ✅ JWT | Criar anúncio |
| GET | `/categories/list` | ❌ | Listar categorias |

**Filtros da listagem:** `search`, `category`, `min_price`, `max_price`, `city`

#### Rentals (`/api/rentals`)
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/` | ❌ | Listar todos aluguéis |
| GET | `/my` | ✅ JWT | Aluguéis do usuário logado |
| POST | `/` | ✅ JWT | Criar reserva (com Redis Lock + Escrow) |
| PATCH | `/:id/pickup` | ✅ JWT | Confirmar retirada |
| PATCH | `/:id/return` | ✅ JWT | Confirmar devolução + liberar pagamento |
| POST | `/:id/confirm` | ✅ JWT | Registrar token QR Code |

#### Reviews (`/api/reviews`)
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/` | ✅ JWT | Criar avaliação (rating 1-5, comment) |
| GET | `/user/:userId` | ❌ | Listar avaliações de um usuário |
| GET | `/pending` | ✅ JWT | Aluguéis concluídos aguardando sua avaliação |

#### Users (`/api/users`)
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/:id` | ❌ | Dados públicos de um usuário |
| PATCH | `/profile` | ✅ JWT | Atualizar nome, telefone, avatar |
| POST | `/kyc` | ✅ JWT | Enviar documento para verificação KYC |
| POST | `/generate-qr` | ✅ JWT | Gerar token QR para um aluguel |
| POST | `/validate-qr` | ✅ JWT | Validar token QR (confirma pickup/return) |

### 4.2 Fluxo de Transação (Escrow)

```
1. Locatário reserva → Pagamento retido (status: 'held')
2. Encontro presencial → Pickup confirmado via PATCH /:id/pickup
3. Locatário usa o item
4. Devolução → PATCH /:id/return
   → status da transaction vira 'released'
   → produto volta a 'available'
```

### 4.3 Concorrência (Redis Lock)
- Ao reservar, um lock é criado no Redis: `lock:product:{product_id}` com TTL de 15min
- Impede que dois usuários reservem o mesmo item simultaneamente
- Lock é removido ao final da operação (sucesso ou falha)

### 4.4 Dependências (backend/package.json)
```json
{
  "@fastify/cors": "^9.0.1",
  "@fastify/jwt": "^8.0.1",
  "@fastify/postgres": "^5.2.0",
  "@fastify/redis": "^6.1.1",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.4.5",
  "fastify": "^4.28.0",
  "stripe": "^16.0.0",
  "uuid": "^10.0.0"
}
```

---

## 5. FRONTEND (Next.js + Tailwind)

### 5.1 Páginas Criadas

| Rota | Descrição | Autenticação |
|------|-----------|-------------|
| `/` | Catálogo com grid de produtos + busca textual + filtro por categoria | ❌ |
| `/login` | Formulário de login | ❌ |
| `/register` | Formulário de cadastro | ❌ |
| `/products/[id]` | Detalhe do produto + calendário de reserva | ❌ (reserva exige login) |
| `/products/new` | Formulário para criar novo anúncio | ✅ |
| `/rentals` | Lista de aluguéis + ações (pickup/return/QR/review) | ✅ |
| `/profile` | Perfil do usuário + KYC + avaliações pendentes | ✅ |

### 5.2 Novos Recursos no Frontend

**QR Code para Confirmação Presencial:**
- Gera um token criptográfico de 64 caracteres por aluguel
- Modal com o token + botão copiar
- Validação no backend confirma pickup ou return automaticamente

**Sistema de Avaliações:**
- Modal de avaliação aparece ao clicar em "Avaliar" nos aluguéis concluídos
- Nota de 1 a 5 + comentário opcional
- Média do usuário é recalculada automaticamente no banco
- Seção "Avaliações Pendentes" no perfil

**KYC (Verificação de Identidade):**
- Formulário na página de perfil para enviar documento (CPF/RG)
- Marca o usuário como `kyc_verified = TRUE` no banco
- Badge visual de verificado no perfil

### 5.2 Componentes
- **Nav.js** — Navbar com navegação condicional (logado vs deslogado)
- **AuthContext.js** — Contexto global de autenticação (login, register, logout, user)
- **lib/api.js** — Cliente HTTP unificado com JWT automático

### 5.3 Dependências (package.json)
```json
{
  "next": "^16.2.6",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "@tailwindcss/postcss": "^4",
  "tailwindcss": "^4"
}
```

---

## 6. VARIÁVEIS DE AMBIENTE (.env)

```env
POSTGRES_USER=rental_user
POSTGRES_PASSWORD=rental_pass
POSTGRES_DB=rental_marketplace
POSTGRES_HOST=db
POSTGRES_PORT=5432

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=change_this_secret_in_production
STRIPE_API_KEY=sk_test_placeholder

API_PORT=3000
```

> **Nota:** `POSTGRES_PORT=5432` é a porta interna do container. Externamente o banco está mapeado na porta `5433` para evitar conflitos com PostgreSQL local.

---

## 7. DADOS DE TESTE (seed)

Usuário padrão:
- **Email:** test@email.com
- **Senha:** 123456

Produtos cadastrados via seed SQL:

| Produto | Categoria | Preço/dia | Caução |
|---------|-----------|-----------|--------|
| Furadeira de Impacto Bosch 650W | Ferramentas | R\$ 35,00 | R\$ 150,00 |
| Drone DJI Mini 3 Pro | Eletrônicos | R\$ 120,00 | R\$ 2.000,00 |
| Caixa de Som JBL PartyBox 310 | Festa | R\$ 80,00 | R\$ 500,00 |

---

## 8. STATUS DO PROJETO (28/05/2026)

### ✅ Concluído

**Infraestrutura:**
- [x] `docker-compose.yml` com 4 serviços (api, web, db, redis)
- [x] Rede `marketplace_network` entre todos os containers
- [x] Volumes persistentes para PostgreSQL e Redis
- [x] Healthcheck no banco de dados

**Backend:**
- [x] Registro e login com JWT + bcryptjs
- [x] CRUD de produtos com Full Text Search em português
- [x] Sistema de reservas com validação de datas (OVERLAPS)
- [x] Redis Lock para concorrência (15 min TTL)
- [x] Fluxo de Escrow (hold → release → refund)
- [x] Confirmação de pickup e return
- [x] Sistema de avaliações (criar, listar, pendentes, média automática)
- [x] Listagem de categorias
- [x] KYC — verificação de identidade com documento
- [x] Geração e validação de QR Code para confirmação presencial
- [x] Atualização de perfil do usuário

**Frontend:**
- [x] Next.js 16 + Tailwind CSS v4 configurado
- [x] Página de catálogo com grid, busca textual e filtro por categoria
- [x] Página de login e cadastro
- [x] Página de detalhe do produto com formulário de reserva
- [x] Página "Meus Aluguéis" com ações de pickup/return
- [x] Navbar responsiva com autenticação condicional
- [x] Contexto de autenticação global
- [x] Página "Criar Anúncio" com formulário completo
- [x] Página de Perfil com edição de dados + KYC + avaliações pendentes
- [x] Modal de QR Code com token copiável
- [x] Modal de avaliação (rating + comentário) pós-devolução
- [x] Build compilado sem erros (9 rotas)

**Testes:**
- [x] API rodando em Docker (localhost:3000)
- [x] Registro de usuário → 201 + token JWT
- [x] Listagem de produtos → 200 + dados
- [x] Busca textual funcionando (`?search=furadeira`)
- [x] Conexão PostgreSQL + Redis via Docker

### 📅 Próximas Etapas

- [ ] **Página de validação de QR Code** — leitor/input para validar token presencialmente
- [ ] **Upload de imagens** — nos anúncios (atualmente via URL)
- [ ] **Notificações** — avisar dono quando alguém reserva
- [ ] **Chat entre usuários** — comunicação antes do aluguel
- [ ] **Testes E2E** — fluxo completo (cadastro → busca → reserva → pickup → return → review)
- [ ] **Deploy** — AWS/GCP

---

## 9. COMANDOS ÚTEIS

```bash
# ===== DOCKER =====

# Subir todo o ambiente
docker compose up -d

# Derrubar tudo
docker compose down

# Logs de serviço específico
docker compose logs api -f
docker compose logs web -f
docker compose logs db -f

# Status dos containers
docker compose ps

# Acessar PostgreSQL via container
docker exec -it app-db-1 psql -U rental_user -d rental_marketplace

# Executar SQL direto
docker exec -i app-db-1 psql -U rental_user -d rental_marketplace -c "SELECT * FROM products;"

# Derrubar tudo e limpar dados (volumes)
docker compose down -v

# Rebuildar um serviço específico
docker compose build api
docker compose build web

# ===== FRONTEND (fora do Docker) =====
cd frontend
npm run dev          # http://localhost:3001
npm run build        # Produção

# ===== BACKEND (fora do Docker) =====
cd backend
npm install
npm run dev          # http://localhost:3000
```
