# Plataforma de Mudança 🌱

Uma ferramenta de apoio a compromissos pessoais e hábitos diários, desenhada sob princípios de **design não-punitivo**. Ideal para pessoas neurodivergentes ou qualquer pessoa buscando consistência leve, focada no progresso sustentável e livre de cobranças, comparações ou punições visuais.

---

## ⚙️ Pré-requisitos

Para rodar a aplicação localmente, você precisa ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- Uma conta/projeto no [Supabase](https://supabase.com/)

---

## 🚀 Instalação e Execução Local

### 1. Configurar o Banco de Dados (Supabase)

Você pode aplicar toda a estrutura de tabelas, índices, políticas de RLS e seeds automaticamente rodando o script de migração no seu terminal:

```bash
npm run migrate
```

Isso executará os seguintes arquivos da pasta [supabase/migrations](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/supabase/migrations/) na ordem correta:
1. `001_schema.sql` — Tabelas, constraints e enums.
2. `002_rls.sql` — Políticas de segurança (RLS).
3. `003_seed.sql` — Documentação e templates de categorias.
4. `004_rewards_and_exceptions.sql` — Recompensas clínicas, Modo Dia Ruim e Vitórias Pequenas.

---

### 2. Configurar Variáveis de Ambiente

Crie ou atualize o arquivo **[.env](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/.env)** na raiz do projeto com as credenciais do seu projeto Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

> **Nota:** O servidor local lerá este arquivo e injetará as variáveis dinamicamente no frontend através do script `/env.js`, sem expor chaves de escrita no repositório.

### 3. Iniciar o Servidor de Desenvolvimento

Abra o terminal na pasta raiz do projeto e execute:

```bash
# Para iniciar o servidor
npm run dev

# Ou alternativamente:
npm start
```

O servidor iniciará na porta **3000**. Acesse:
👉 **[http://localhost:3000](http://localhost:3000)** no seu navegador.

---

## 🏗️ Arquitetura do Projeto (MVC 6 Camadas)

O projeto é estruturado em uma arquitetura desacoplada de 6 camadas que rodam puramente no navegador (SPA) sem bundlers pesados:

1. **Configuração (Layer 1)**: Inicialização do Supabase client, variáveis de ambiente e constantes gerais ([js/config](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/config/)).
2. **Models (Layer 2)**: CRUD puro de comunicação com o Supabase ([js/models](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/models/)).
3. **Services (Layer 3)**: Lógicas e regras de negócio complexas: streak, XP, relatórios e exportações ([js/services](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/services/)).
4. **Controllers (Layer 4)**: Orquestração do fluxo de dados das telas e interceptação de ações do usuário ([js/controllers](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/controllers/)).
5. **Views (Layer 5)**: Criação dinâmica de elementos HTML, manipulação do DOM e escuta de eventos de UI ([js/views](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/views/)).
6. **App / Router (Layer 6)**: Ponto de entrada, roteador SPA baseado em hashes (`#`) e auth guards ([js/app.js](file:///c:/Users/Inteli/Documents/pessoal/plat_mudanca/js/app.js)).

---

## 🎨 Princípios do Design Não-Punitivo Aplicados

- **Sem Alertas Vermelhos**: Falhas ou registros marcados como "não cumprido" são destacados em tom cinza-azulado (`#5A6478`) neutro e suave. O vermelho é evitado para não gerar estresse visual ou gatilhos de incapacidade.
- **Tolerância a Falhas (Streak Protection)**: Uma única falha intercalada entre dias de conclusão não zera o streak de hábitos. O streak entra em estado visual *Pendente/Pausa* no dia do erro e só reseta se houver duas falhas consecutivas.
- **Acúmulo de XP Vegetal**: O progresso acumulado na plataforma é representado por níveis baseados na natureza (Semente 🌱, Broto 🌿, Muda ☘️, Raiz 🪵, Galho 🌳, Árvore 🌲). O XP acumulado **nunca diminui**.
- **Trava de Edição de Metas**: Para evitar a autossabotagem de deletar ou enfraquecer metas em dias difíceis, as edições de compromissos são travadas e permitidas apenas no "dia de revisão" escolhido pelo próprio usuário (a trava pode ser desativada na aba de Ajustes em caso de necessidade real).
- **Sem Comparações**: Não existem recursos sociais de rank, compartilhamento compulsório ou contadores de "dias perdidos". A ferramenta foi pensada para ser um diário seguro e individual.

```
plat_mudanca
├─ .agents
│  └─ skills
│     ├─ supabase
│     │  ├─ assets
│     │  │  └─ feedback-issue-template.md
│     │  ├─ CHANGELOG.md
│     │  ├─ references
│     │  │  └─ skill-feedback.md
│     │  └─ SKILL.md
│     └─ supabase-postgres-best-practices
│        ├─ CHANGELOG.md
│        ├─ references
│        │  ├─ advanced-full-text-search.md
│        │  ├─ advanced-jsonb-indexing.md
│        │  ├─ conn-idle-timeout.md
│        │  ├─ conn-limits.md
│        │  ├─ conn-pooling.md
│        │  ├─ conn-prepared-statements.md
│        │  ├─ data-batch-inserts.md
│        │  ├─ data-n-plus-one.md
│        │  ├─ data-pagination.md
│        │  ├─ data-upsert.md
│        │  ├─ lock-advisory.md
│        │  ├─ lock-deadlock-prevention.md
│        │  ├─ lock-short-transactions.md
│        │  ├─ lock-skip-locked.md
│        │  ├─ monitor-explain-analyze.md
│        │  ├─ monitor-pg-stat-statements.md
│        │  ├─ monitor-vacuum-analyze.md
│        │  ├─ query-composite-indexes.md
│        │  ├─ query-covering-indexes.md
│        │  ├─ query-index-types.md
│        │  ├─ query-missing-indexes.md
│        │  ├─ query-partial-indexes.md
│        │  ├─ schema-constraints.md
│        │  ├─ schema-data-types.md
│        │  ├─ schema-foreign-key-indexes.md
│        │  ├─ schema-lowercase-identifiers.md
│        │  ├─ schema-partitioning.md
│        │  ├─ schema-primary-keys.md
│        │  ├─ security-privileges.md
│        │  ├─ security-rls-basics.md
│        │  ├─ security-rls-performance.md
│        │  ├─ _contributing.md
│        │  ├─ _sections.md
│        │  └─ _template.md
│        └─ SKILL.md
├─ .env
├─ create-user.js
├─ css
│  ├─ animations.css
│  ├─ components.css
│  └─ main.css
├─ db.js
├─ index.html
├─ js
│  ├─ app.js
│  ├─ config
│  │  ├─ constants.js
│  │  ├─ env.js
│  │  └─ supabase.js
│  ├─ controllers
│  │  ├─ CompromissoController.js
│  │  ├─ HistoricoController.js
│  │  ├─ HomeController.js
│  │  ├─ RevisaoController.js
│  │  └─ RitmoController.js
│  ├─ models
│  │  ├─ CategoriaModel.js
│  │  ├─ CheckModel.js
│  │  ├─ CompromissoModel.js
│  │  ├─ DiarioModel.js
│  │  └─ VitoriaPequenaModel.js
│  ├─ services
│  │  ├─ AuthService.js
│  │  ├─ ExportService.js
│  │  ├─ RevisaoService.js
│  │  ├─ StreakService.js
│  │  └─ XPService.js
│  └─ views
│     ├─ AuthView.js
│     ├─ CompromissoView.js
│     ├─ HistoricoView.js
│     ├─ HomeView.js
│     ├─ RevisaoView.js
│     └─ RitmoView.js
├─ migrate.js
├─ package-lock.json
├─ package.json
├─ README.md
├─ server.js
├─ skills-lock.json
├─ supabase
│  └─ migrations
│     ├─ 001_schema.sql
│     ├─ 002_rls.sql
│     ├─ 003_seed.sql
│     └─ 004_rewards_and_exceptions.sql
└─ test-db.js

```