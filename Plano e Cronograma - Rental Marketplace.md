# Plano e Cronograma — Rental Marketplace

> Marketplace P2P de aluguel de equipamentos de alto valor. Conecta donos de itens ociosos a locatários que precisam usar por poucos dias.

---

## 1. VISÃO GERAL DO PROJETO

**Proposta:** "Airbnb de ferramentas e equipamentos" — plataforma transacional com foco em confiança, segurança e nicho.

**Monetização:** Retenção de 15-20% por transação. Custo de estoque zero.

**Diferenciais:** Seguro integrado, verificação de identidade rigorosa, sistema de Escrow (custódia).

**Estratégia Inicial:** Focar em um nicho (ex: ferramentas de construção civil ou equipamentos para eventos) para simplificar logística e segurança.

---

## 2. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                      │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐ │
│  │ Frontend │  │ Backend  │  │ Redis  │  │ Postgres│ │
│  │ (Web/Mobile)│ (Node/TS)│  │ (Cache)│  │  (DB)  │ │
│  └──────────┘  └──────────┘  └────────┘  └────────┘ │
│                    marketplace_network                 │
└─────────────────────────────────────────────────────┘
```

**Stack:**
- Frontend: React Native ou Flutter (mobile) + Next.js (web)
- Backend: Node.js/TypeScript (Fastify)
- Cache/Queue: Redis (sessões, locks de aluguel)
- Database: PostgreSQL (relacional + Full Text Search)
- Infra: AWS / GCP

---

## 3. REQUISITOS FUNCIONAIS (RF)

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Catálogo de Itens | Busca com filtros por categoria, preço e proximidade |
| RF02 | Motor de Reservas | Bloqueio de datas em tempo real (evitar overbooking) |
| RF03 | Sistema de Escrow | Pagamento retido até devolução sem danos |
| RF04 | KYC | Verificação de identidade para locadores e locatários |
| RF05 | Reputação | Avaliações bilaterais (estrelas + comentários) |
| RF06 | QR Code | Confirmação de entrega/devolução via token |

---

## 4. REQUISITOS NÃO FUNCIONAIS (RNF)

| ID | Requisito | Descrição |
|---|---|---|
| RNF01 | Escalabilidade | Arquitetura que suporte picos (finais de semana) |
| RNF02 | Performance | Carregamento rápido de imagens |
| RNF03 | Persistência | Volumes Docker mapeados (não perder dados) |
| RNF04 | Segurança | JWT em todos os endpoints sensíveis |
| RNF05 | Concorrência | Redis lock para evitar aluguel duplicado |

---

## 5. WORKFLOW COMPLETO

```
1. Anúncio   → Dono cadastra item (fotos, valor diária, caução)
2. Aluguel   → Locatário reserva e paga (valor retido em Escrow)
3. Retirada  → Encontro físico. Ambos confirmam via QR Code
4. Uso       → Período de aluguel transcorre
5. Devolução → Dono valida estado → sistema libera pagamento + caução
```

---

## 6. MODELO DE DADOS (PostgreSQL)

**Tabelas principais:**
- `users` — id, nome, email, documento (KYC), reputação
- `products` — id, dono_id, categoria, preco_dia, valor_caucao, fotos, status
- `rentals` — id, item_id, locatario_id, data_inicio, data_fim, status (active|completed|disputed)
- `transactions` — id, rental_id, status_pagamento, valor_total, escrow_status
- `reviews` — id, rental_id, avaliador_id, notas, comentário

---

## 7. CRONOGRAMA DE CRIAÇÃO

### FASE 1 — Fundação (Semanas 1-2)
| Semana | Atividade | Entregáveis |
|--------|-----------|-------------|
| **Sem 1** | Setup de infraestrutura + Banco de Dados | docker-compose.yml, schemas SQL, rede Docker, Full Text Search |
| **Sem 2** | Backend — Autenticação + CRUD Produtos | API users com JWT, endpoints de produtos e categorias |

### FASE 2 — Core Transacional (Semanas 3-4)
| Semana | Atividade | Entregáveis |
|--------|-----------|-------------|
| **Sem 3** | Motor de Reservas + Redis Lock | Sistema de bloqueio de datas, prevenção de concorrência |
| **Sem 4** | Sistema de Escrow + Pagamentos | Integração Stripe, retenção e liberação de valores, caução |

### FASE 3 — Segurança + Frontend Parte 1 (Semanas 5-6)
| Semana | Atividade | Entregáveis |
|--------|-----------|-------------|
| **Sem 5** | KYC + Reputação | Verificação de identidade, reviews bilaterais, score |
| **Sem 6** | Frontend — Catálogo e Busca | Grid de produtos, filtros (categoria/preço/distância), geolocalização |

### FASE 4 — Frontend Parte 2 + Deploy (Semanas 7-8)
| Semana | Atividade | Entregáveis |
|--------|-----------|-------------|
| **Sem 7** | Frontend — Fluxo de Aluguel + QR Code | Reserva, pagamento, confirmação presencial via QR Code |
| **Sem 8** | Testes + Deploy MVP | QA, ajustes finos, deploy AWS/GCP, primeiro nicho ao vivo |

> **Duração total estimada: 8 semanas (2 meses)**

---

## 8. PROMPTS PARA GERAÇÃO (IA)

### Prompt 1 — Banco de Dados
> "Crie o esquema de banco de dados para um Marketplace de Aluguel. Tabelas necessárias: 'products' (dono_id, categoria, preco_dia, valor_caucao), 'rentals' (item_id, locatario_id, data_inicio, data_fim, status: active, completed, disputed) e 'transactions' (status_pagamento, valor_total). Inclua suporte a busca textual (Full Text Search) para os produtos."

### Prompt 2 — Backend (Escrow)
> "Desenvolva uma função em Node.js que gerencie a lógica de Escrow (custódia). O sistema deve: 1. Reter o pagamento no ato da reserva; 2. Só liberar o valor ao locador após o webhook de 'entrega confirmada' ser disparado; 3. Gerenciar estornos de caução automaticamente. Utilize a lógica de integração com a API do Stripe."

### Prompt 3 — Frontend (Busca)
> "Crie o componente de 'Busca Avançada' em React Native. Deve permitir filtrar por categoria (ferramentas, eletrônicos, festas), distância (usando geolocalização) e faixa de preço. O layout deve ser em grid com imagens grandes e selos de 'Verificado' nos donos dos itens."

### Prompt 4 — Docker Completo
> "Desenvolva o arquivo docker-compose.yml para um Marketplace de Aluguel. O arquivo deve conter: 1. Serviço 'api' (Node.js); 2. Serviço 'db' (PostgreSQL); 3. Serviço 'redis' (para cache de buscas e sessões). Configure uma rede Docker chamada 'marketplace_network' para comunicação interna e exponha as portas necessárias para acesso externo. Inclua mapeamento de volumes persistentes."

### Prompt 5 — Estrutura de Pastas
> "Estruture o diretório do projeto da seguinte forma:
> /app
> /backend (código fonte + Dockerfile)
> /frontend (código fonte + Dockerfile)
> /database (scripts .sql de inicialização)
> docker-compose.yml
> 
> Gere o docker-compose.yml unificando os serviços de API, Banco de Dados e Cache, garantindo que o frontend consuma a API via variáveis de ambiente."

---

## 9. ESTRUTURA DE DIRETÓRIOS

```
/app
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── init.sql
│   └── seed.sql
├── docker-compose.yml
└── .env
```

---

## 10. PRINCÍPIOS DE DESENVOLVIMENTO

- **Modularidade:** Construir por partes (banco → backend → frontend), validando cada etapa
- **Segurança:** JWT em todos os endpoints; Escrow com Stripe; dados sensíveis em .env
- **Persistência:** Volumes Docker mapeados para evitar perda de dados em restart
- **Logs:** Logs estruturados em todos os contêineres para debug
- **Comunicação interna:** Serviços se comunicam pelo nome do container (ex: `host: db`), não por localhost
