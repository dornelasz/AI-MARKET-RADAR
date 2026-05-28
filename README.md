# AI Market Radar

Radar inteligente de mercado para acompanhar **Inteligência Artificial em tempo real**.
O sistema coleta automaticamente notícias, releases, papers e atualizações de
ferramentas de IA a partir de **fontes públicas e legítimas** (RSS/Atom, GitHub
Releases, arXiv, páginas web simples), salva tudo em banco, opcionalmente analisa
com IA (Gemini), classifica por importância e mostra em um dashboard moderno.

> Projeto independente. Não reutiliza código, dados ou estrutura de nenhum outro produto.
> Nunca cria notícias, fontes, links ou datas falsas — toda notícia tem URL e fonte reais.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (tema escuro premium, responsivo)
- **Prisma** + **PostgreSQL**
- **Worker** Node.js com cron (`node-cron`)
- **Gemini** opcional (`@google/generative-ai`) via variável de ambiente
- Testes com **Vitest**

## Funcionalidades

- Coletores: RSS/Atom, GitHub Releases (`/releases.atom`), arXiv (API Atom) e
  páginas web simples (sem burlar paywall/login/captcha).
- Deduplicação: normalização de URL, remoção de parâmetros de tracking,
  `canonicalUrl` e `contentHash` — coletas repetidas não geram duplicatas.
- Score local (heurístico) + score híbrido (local + IA quando disponível).
- Análise opcional por IA com saída **JSON validada** (resumo, impacto, categoria,
  relevância, empresas, tecnologias, sinais de mercado, oportunidades, riscos).
- Dashboard, lista/detalhe de artigos, fontes (CRUD), alertas internos,
  digest diário e configurações.
- **Funciona sem Gemini**: a coleta roda, os artigos ficam `PENDING_ANALYSIS`,
  e a interface mostra um aviso — nenhuma tela quebra.

## Estrutura

```
src/
  app/            # App Router: páginas + /api (rotas)
  components/     # Componentes de UI reutilizáveis
  lib/
    ai/           # Gemini, prompt, parse/validação JSON, serviço de análise
    collectors/   # fetcher, parser RSS/Atom, github, arxiv, webpage, runner
    db/           # cliente Prisma + queries compartilhadas
    dedup/        # normalização de URL, hashing, deduplicação
    scoring/      # score local e híbrido
    trends/       # agregação de tendências
    digest/       # geração do resumo diário
  worker/         # worker cron + scripts fetch:run / analyze:pending
prisma/           # schema, migrations, seed
tests/            # testes (vitest)
```

## Pré-requisitos

- Node.js >= 18.18 (testado com Node 22)
- PostgreSQL 14+ (ou Docker)

## 1. Instalar

```bash
npm install
```

## 2. Configurar o `.env`

Copie o exemplo e ajuste:

```bash
cp .env.example .env
```

Variáveis:

| Variável | Descrição | Padrão |
|---|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL | — |
| `GEMINI_API_KEY` | Chave do Gemini (opcional) | vazio |
| `GEMINI_MODEL` | Modelo Gemini | `gemini-1.5-flash` |
| `AI_ANALYSIS_ENABLED` | Liga/desliga análise por IA | `true` |
| `AI_BATCH_SIZE` | Artigos por lote de análise | `5` |
| `AI_ANALYSIS_DAILY_LIMIT` | Limite diário de análises | `50` |
| `FETCH_INTERVAL_MINUTES` | Intervalo de coleta do worker | `15` |
| `NEXT_PUBLIC_APP_URL` | URL pública do app | `http://localhost:3000` |

## 3. Subir o PostgreSQL

Com Docker (recomendado):

```bash
docker compose up -d
# Postgres em localhost:5432, db ai_market_radar, user/senha radar/radar
```

Use então:

```
DATABASE_URL="postgresql://radar:radar@localhost:5432/ai_market_radar?schema=public"
```

(Ou aponte `DATABASE_URL` para qualquer PostgreSQL existente.)

## 4. Migrations

```bash
npm run prisma:generate   # gera o Prisma Client
npm run prisma:migrate    # aplica migrations em desenvolvimento
# em produção: npm run prisma:deploy
```

## 5. Seed (fontes iniciais reais)

```bash
npm run prisma:seed
```

Cadastra fontes **reais e públicas**:

- **Ativas:** GitHub Releases (Atom) de `langchain-ai/langchain`,
  `huggingface/transformers`, `openai/openai-python`, `ollama/ollama`,
  `ggerganov/llama.cpp`, `vllm-project/vllm`.
- **Inativas (validar antes de ativar):** arXiv cs.AI/cs.LG (a API do arXiv pode
  retornar HTTP 403 para IPs de datacenter), além de OpenAI, Anthropic, Google AI,
  Meta AI, Product Hunt, TechCrunch e VentureBeat — com `notes` explicando que o
  feed RSS exato não foi confirmado.

## 6. Iniciar o app

```bash
npm run dev      # desenvolvimento (http://localhost:3000)
# ou
npm run build && npm run start   # produção
```

## 7. Coleta de notícias

Manual (one-shot), pela CLI:

```bash
npm run fetch:run
```

Pela interface: botão **“Coletar agora”** no Dashboard, ou **“Coletar”** por fonte
na página **Fontes**. Pela API: `POST /api/fetch/run` ou `POST /api/sources/:id/fetch`.

## 8. Worker (coleta agendada)

```bash
npm run worker
```

Roda a cada `FETCH_INTERVAL_MINUTES`: coleta as fontes ativas, salva artigos novos,
ignora duplicados, registra `FetchLog` e — se o Gemini estiver configurado —
analisa um pequeno lote de pendentes. Uma fonte que falha **não derruba** o worker.

## 9. Configurar o Gemini (opcional)

1. Defina `GEMINI_API_KEY` no `.env` (e mantenha `AI_ANALYSIS_ENABLED=true`).
2. Em **Configurações**, use **“Testar Gemini API”** para validar a chave.
3. Analise artigos:
   - **“Analisar pendentes”** (lote) em Configurações, ou `POST /api/articles/analyze-pending`;
   - **“Analisar com IA”** no detalhe do artigo, ou `POST /api/articles/analyze/:id`;
   - via CLI: `npm run analyze:pending`.

Sem a chave, tudo continua funcionando: os artigos ficam pendentes e os botões
informam que falta a `GEMINI_API_KEY`.

## 10. Tendências e Digest

- **Tendências:** agregadas a partir das análises reais (empresas, tecnologias e
  palavras-chave mais citadas). API: `GET /api/trends`.
- **Digest diário:** `GET /api/digest/today` e `POST /api/digest/generate`
  (ou o botão na página **Digest**). Gerado estritamente a partir dos artigos do dia.

## 11. Testes

```bash
npm run test        # roda toda a suíte
npm run typecheck   # checagem de tipos
npm run lint        # ESLint
```

Cobertura inclui: normalização de URL, remoção de tracking, deduplicação,
parsing RSS/Atom (inclusive feeds com muitas entidades), resiliência a falha de
fonte, comportamento sem Gemini, validação de JSON da IA (válido e inválido),
score local e híbrido, tendências e geração do digest.

## Endpoints da API

| Método | Rota |
|---|---|
| GET | `/api/articles` (filtros: `q`, `category`, `relevance`, `source`, `from`, `to`, `page`) |
| GET | `/api/articles/:id` |
| POST | `/api/articles/analyze/:id` |
| POST | `/api/articles/analyze-pending` |
| GET/POST | `/api/sources` |
| PATCH/DELETE | `/api/sources/:id` |
| POST | `/api/sources/:id/fetch` |
| POST | `/api/fetch/run` |
| GET | `/api/fetch/logs` |
| GET/POST | `/api/alerts` |
| PATCH/DELETE | `/api/alerts/:id` |
| GET | `/api/digest/today` · POST `/api/digest/generate` |
| GET | `/api/settings/status` · POST `/api/settings/test-ai` |
| GET | `/api/trends` |

## Limitações atuais

- **Alertas** são internos (aparecem apenas no painel). Sem e-mail/notificações.
- **Sem autenticação/login, pagamento ou multiusuário** (fora do escopo da V1).
- O **coletor de páginas web** é básico (título, meta description e texto principal);
  não executa JavaScript nem contorna paywalls/login/captcha.
- **arXiv** pode retornar HTTP 403 em alguns provedores/IPs de datacenter; valide na
  sua rede antes de ativar.
- A análise por IA depende do Gemini e respeita `AI_BATCH_SIZE` /
  `AI_ANALYSIS_DAILY_LIMIT` (sem fila/agendamento avançado ainda).

## Próximos passos sugeridos

- Notificações de alertas (e-mail/webhook) e correspondência de alertas com artigos.
- Mais fontes confirmadas (blogs oficiais com RSS verificado).
- Agendamento/limite de análise por IA com fila e backoff.
- Paginação e busca full-text mais ricas; filtros por tipo de artigo.
- Autenticação multiusuário.
