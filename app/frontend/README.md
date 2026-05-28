# Rental Marketplace — Frontend

Aplicação web para marketplace de aluguel de equipamentos.

**Stack:** Next.js 16, React 19, Tailwind CSS v4  
**Porta:** 3001 (desenvolvimento)

---

## ⚡ Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001) no navegador.

> **Nota:** O backend precisa estar rodando em `http://localhost:3000`.  
> Para subir o backend, use `docker compose up -d` na raiz do projeto (`../`).

---

## 📄 Páginas

| Rota | Descrição | Requer Login |
|------|-----------|:---:|
| `/` | Catálogo com busca e filtros | ❌ |
| `/login` | Entrar | ❌ |
| `/register` | Criar conta | ❌ |
| `/products/[id]` | Detalhe do produto + reserva | ❌* |
| `/products/new` | Criar anúncio | ✅ |
| `/rentals` | Meus aluguéis + QR Code + avaliações | ✅ |
| `/profile` | Editar perfil + KYC + avaliações pendentes | ✅ |

*\* Reserva exige login*

---

## 🧩 Componentes

| Arquivo | Descrição |
|---------|-----------|
| `components/Nav.js` | Navbar com navegação condicional |
| `context/AuthContext.js` | Estado global de autenticação |
| `lib/api.js` | Cliente HTTP para a API |

---

## 🔧 Variáveis de Ambiente

No arquivo `.env.local` na raiz do frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Se não definido, o padrão é `http://localhost:3000/api`.

---

## 📦 Scripts

```bash
npm run dev     # Desenvolvimento (localhost:3001)
npm run build   # Build de produção
npm start       # Servir build (porta 3001)
npm run lint    # Verificar erros
```

---

## 🐳 Docker

No ambiente Docker completo (usando `docker compose` na raiz), o frontend é servido na porta 3001 automaticamente.

```bash
cd .. && docker compose up -d
```

---

## 🗄️ Estrutura

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js           # Layout global
│   │   ├── page.js             # Home (catálogo)
│   │   ├── login/page.js       # Login
│   │   ├── register/page.js    # Cadastro
│   │   ├── profile/page.js     # Perfil + KYC
│   │   ├── products/
│   │   │   ├── [id]/page.js    # Detalhe do produto
│   │   │   └── new/page.js     # Criar anúncio
│   │   └── rentals/page.js     # Meus aluguéis
│   ├── components/
│   │   └── Nav.js
│   ├── context/
│   │   └── AuthContext.js
│   └── lib/
│       └── api.js
├── Dockerfile                  # Multi-stage build
└── package.json
```
