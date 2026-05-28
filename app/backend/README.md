# Rental Marketplace — Backend

API REST para marketplace de aluguel de equipamentos.

**Stack:** Node.js, Fastify, PostgreSQL, Redis, Docker  
**Porta:** 3000

---

## ⚡ Início Rápido (Docker)

```bash
# Subir todos os serviços
docker compose up -d

# Verificar se está rodando
curl http://localhost:3000/api/products
```

**Serviços:**
| Serviço | Porta | Descrição |
|---------|-------|-----------|
| API | 3000 | Backend Node.js |
| PostgreSQL | 5433 | Banco de dados |
| Redis | 6379 | Cache e locks |

---

## ▶️ Como Rodar Localmente (sem Docker)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (copie do arquivo na raiz do projeto)
#    Ajuste POSTGRES_HOST e REDIS_HOST para localhost

# 3. Criar banco de dados
psql -U postgres -c "CREATE DATABASE rental_marketplace;"
psql -U postgres -d rental_marketplace -f ../database/init.sql

# 4. Iniciar servidor
npm run dev
```

---

## 📖 Documentação Interativa da API

Acesse no navegador:

```
http://localhost:3000/docs
```

Página HTML completa com todos os endpoints, parâmetros e exemplos.

---

## 📬 Endpoints

### Auth `/api/auth`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/register` | ❌ | Cadastrar (`name`, `email`, `password`) |
| POST | `/login` | ❌ | Login (`email`, `password`) |
| GET | `/me` | ✅ | Dados do usuário logado |

### Products `/api/products`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/` | ❌ | Listar (filtros: `search`, `category`, `min_price`, `max_price`, `city`) |
| GET | `/:id` | ❌ | Detalhes do produto |
| POST | `/` | ✅ | Criar anúncio |
| GET | `/categories/list` | ❌ | Listar categorias |

### Rentals `/api/rentals`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/` | ❌ | Listar todos |
| GET | `/my` | ✅ | Meus aluguéis |
| POST | `/` | ✅ | Criar reserva (`product_id`, `start_date`, `end_date`) |
| PATCH | `/:id/pickup` | ✅ | Confirmar retirada |
| PATCH | `/:id/return` | ✅ | Confirmar devolução |

### Reviews `/api/reviews`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/` | ✅ | Criar avaliação (`rental_id`, `rating`, `comment`) |
| GET | `/user/:userId` | ❌ | Avaliações de um usuário |
| GET | `/pending` | ✅ | Pendentes do usuário logado |

### Users `/api/users`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/:id` | ❌ | Dados públicos |
| PATCH | `/profile` | ✅ | Atualizar perfil |
| POST | `/kyc` | ✅ | Enviar documento KYC |
| POST | `/generate-qr` | ✅ | Gerar token QR |
| POST | `/validate-qr` | ✅ | Validar token QR |

---

## 🔐 Autenticação

Todos os endpoints protegidos usam JWT via `Authorization: Bearer <token>`.

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"123456"}'

# Usar o token retornado
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🗄️ Estrutura

```
backend/
├── src/
│   ├── index.js           # Entrypoint Fastify
│   ├── routes/
│   │   ├── auth.js        # Cadastro, login, perfil atual
│   │   ├── products.js    # CRUD + busca Full Text Search
│   │   ├── rentals.js     # Reservas com Redis Lock + Escrow
│   │   ├── reviews.js     # Avaliações bilaterais
│   │   └── users.js       # Perfil, KYC, QR Code
│   └── services/
│       └── escrow.js      # Lógica de custódia de pagamento
├── Dockerfile
└── package.json
```

---

## 🧪 Dados de Teste

```bash
# Usuário padrão
email: test@email.com
senha: 123456

# Produtos seed
- Furadeira Bosch 650W — R$ 35/dia
- Drone DJI Mini 3 Pro — R$ 120/dia
- Caixa de Som JBL PartyBox 310 — R$ 80/dia
```

---

## 📦 Scripts

```bash
npm run dev    # Desenvolvimento com hot-reload
npm start      # Produção
```
