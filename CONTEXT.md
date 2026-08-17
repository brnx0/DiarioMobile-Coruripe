# CONTEXT.md — Monorepo DiarioMobile

> Mapa do projeto. Atualizar quando estrutura mudar.
> Branch ativa: `refactor/monorepo-api`.

## Visão Geral

Monorepo pnpm workspaces com:
- App mobile Expo/React Native (professores).
- API Fastify/Prisma sobre SQL Server legado (`EDU_LIVE_M5_DEV`).
- Pacotes compartilhados (tipos + schemas zod).

```
C:\projetos\DiarioMobile\          (root monorepo)
├── apps/
│   ├── mobile/                    Expo RN
│   └── api/                       Fastify + Prisma
├── packages/
│   ├── shared-types/              interfaces compartilhadas
│   └── shared-schemas/            zod schemas compartilhados
├── package.json                   (corepack pnpm)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .npmrc                         (node-linker=hoisted)
```

## Stack

### API (`apps/api/`)
- **Runtime:** Node ≥20, ESM (`"type": "module"`).
- **Framework:** Fastify 5 + plugins (`@fastify/cors`, `helmet`, `rate-limit`, `jwt`, `sensible`).
- **DB:** Prisma 5 + SQL Server (`prisma db pull` only — DB compartilhado, **NÃO usar `migrate`**).
- **Validação:** zod (via shared-schemas).
- **Auth:** JWT access (15m) + refresh (7d). Senha legada: `MD5(USR_CODIGO || senha_plain)`.
- **Logger:** pino + pino-pretty (dev).
- **Scripts:** `pnpm api:dev`, `prisma:pull`, `prisma:generate`.

### Mobile (`apps/mobile/`)
- **Runtime:** Expo SDK 54, RN 0.81, React 19.
- **Estilo:** NativeWind (Tailwind 3.4).
- **Navegação:** `@react-navigation/native` v7 (native-stack + bottom-tabs).
- **HTTP:** axios (singleton em `src/services/apiClient.ts`).
- **Storage:** `expo-secure-store`.
- **Toast:** `react-native-toast-message` via `AlertContext`.

### Shared (`packages/`)
- **shared-types:** interfaces TS (`AuthUser`, `JwtAccessPayload`, `School`, `ClassDiscipline`, `AttendanceStudent`, `LessonPlan`, etc).
- **shared-schemas:** zod schemas para validação compartilhada.

## API — Endpoints Implementados

### Auth (`/auth`)
- `POST /auth/login` — `{ login, senha }` → `{ accessToken, refreshToken, user }`.
- `POST /auth/refresh` — `{ refreshToken }` → `{ accessToken, refreshToken }`.
- `GET /auth/me` — protegido — `AuthUser`.

### Academic (`/academic`)
- `GET /academic/years` — lista anos letivos (ativo + históricos).
- `GET /academic/schools?year=` — escolas vinculadas ao professor.
- `GET /academic/schools/:schoolId/classes?year=` — turmas-disciplina (TMD_COD).
- `GET /academic/schools/:schoolId/grades` — séries.
- `GET /academic/schools/:schoolId/subjects?classId=&gradeId=&year=` — disciplinas.
- `GET /academic/class-disciplines/:classDisciplineId/weekdays` — dias da semana alocados.
- `GET /academic/schools/:schoolId/upcoming-classes?year=` — próximas aulas (grade horária).

### Diary (`/diary`)
- `GET /diary/class-disciplines/:classDisciplineId/attendance?date=` — alunos + frequência da data.
- `PATCH /diary/attendance` — `{ students: UpdateAttendanceStudent[] }`.
- `PATCH /diary/content/:diaryContentId` — `{ content, methodology }`.
- `GET /diary/class-disciplines/:classDisciplineId/content-history`.
- `POST /diary/content/:diaryContentId/replicate` — replica conteúdo p/ outras aulas.

### Lesson Plans (`/lesson-plans`)
- `GET /lesson-plans?schoolId=&nextDays=` — lista planos.
- `POST /lesson-plans` — cria.
- `PATCH /lesson-plans/:lessonPlanId` — edita.
- `DELETE /lesson-plans/:lessonPlanId` — remove.

### Outros
- `GET /health` — status.

## API — Estrutura interna

```
apps/api/src/
├── app.ts                         buildApp() — Fastify + plugins + rotas
├── server.ts                      bootstrap (listen)
├── config/
│   └── env.ts                     dotenv + zod (DATABASE_URL, JWT_*, etc)
├── plugins/
│   ├── auth.ts                    @fastify/jwt + decorate authenticate
│   ├── db.ts                      Prisma client singleton
│   └── error-handler.ts           setErrorHandler global (zod, 5xx, 404)
├── lib/
│   ├── crypto.ts                  hashLegacyPassword (MD5(USR_CODIGO+senha))
│   └── jwt.ts                     sign/verify access+refresh
└── modules/
    ├── auth/                      auth.routes + auth.service
    ├── academic/                  raw queries SQL legacy
    ├── diary/                     idem
    ├── lesson-plans/              idem
    └── legacy/                    (vazio — placeholder)

prisma/schema.prisma               só FrUsuario hoje. Outras tabelas via $queryRaw.
```

## Mobile — Estado

### Já refatorado ✓
- App.tsx (providers tree).
- `src/routes/` (auth gate + splash).
- `src/navigation/AppTabs.tsx` (bottom tabs custom).
- `components/BottomNavigation.tsx`, `AppHeader.tsx`, `BackgroundPattern.tsx`.
- `src/context/AlertContext.tsx`, `AuthContext.tsx`, `SelectionContext.tsx`.
- Login, Home, TurmasDetails, CalendarioEscolar, ProximasAulas, ListaPlanosAulas, PlanosAulas, ReplicarConteudo, AttendanceList, AvaliacoesTab.

### Migrado para nova API ✓
Mobile agora consome **somente** a API Fastify nova. Services legados removidos.

Mapping atual (mobile → endpoint):

| Mobile service | Endpoint |
|---|---|
| `services/Auth.ts` `loginRequest` / `refreshRequest` | `POST /auth/login`, `POST /auth/refresh` |
| `services/academic.ts` `fetchSchools/Classes/Grades/Subjects/Weekdays/UpcomingClasses/Years` | `/academic/*` |
| `services/diary.ts` `fetchAttendance/updateAttendance/updateContent/fetchContentHistory/replicateContent` | `/diary/*` |
| `services/lessonPlans.ts` `fetchLessonPlans/createLessonPlan/updateLessonPlan/deleteLessonPlan` | `/lesson-plans/*` |
| `services/evaluations.ts` (periods, types, list, students, grades, indicators) | `/evaluations/*` (stub na API) |
| Calendário (gap) | sem endpoint — placeholder na tela |

### Shapes
API retorna camelCase (`{ id, name, schoolId, ... }`).
Mobile usa esses tipos diretamente via `@diariomobile/shared-types`.

## Domínio (DB legado)

### Tabelas-chave
- `FR_USUARIO` (USR_CODIGO, USR_LOGIN, USR_SENHA MD5, USR_NOME, PES_COD).
- `EDU_TURMA_DISCIPLINA_PROFESSOR` (TMD_COD, ESC_COD, TMA_COD, DIS_COD, SER_COD, CUR_COD, PES_COD_PROFESSOR, TMD_ANO_LETIVO).
- `EDU_TURMA` (TMA_COD, TMA_NOME, SER_COD, TUR_COD).
- `EDU_DISCIPLINA` (DIS_COD, DIS_NOME_MEC).
- `EDU_ESCOLA` (ESC_COD, ESC_NOME_COMPLETO).
- `EDU_SERIE` (SER_COD, SER_NOME).
- `EDU_QUADRO_DE_HORARIOS` + `_DETALHE` (grade horária).
- `EDU_DIARIO_CONTEUDO` (frequência, conteúdo) — usado em diary.

### Senha legada
`USR_SENHA = MD5(USR_CODIGO || senha_plain)` (hex 32 chars).
Confirmado: USR_CODIGO=1 + senha="1" → `6512bd43d9caa6e02c990b0a82652dca`.

### Conexão DB (DEV)
- Server: `10.0.10.27:1433`.
- Database: `EDU_LIVE_M5_DEV`.
- User: `mateus.araujo`.
- Senha em `.env` (não commitado).

## Convenções

### API
- Todas rotas sob `/auth`, `/academic`, `/diary`, `/lesson-plans` (sem `/v1`).
- Validação body/query/params via zod (shared-schemas).
- `service` recebe `prisma` no constructor — testável.
- Raw queries via `Prisma.sql` (parameterizadas — sem injection).
- Erro padrão: `{ statusCode, error, message, issues? }`.

### Mobile
- `useAuth().{ user, signIn, signOut, loading }`.
- `useSelection().{ selectedEscola, selectedTurma, ... }` — filtros globais.
- `useAlert().showToast(text, type, text2)`.
- Header `Authorization: Bearer <accessToken>` (após migração — atual sem Bearer).
- Empty state em telas que dependem de seleção.

### Shared
- Tipos camelCase. Nada de `_COD`/`_NOME` em DTO público.
- Schemas zod exportam tipo via `z.infer<typeof X>`.

## Segurança
- Senha JWT em `.env` (32+ chars).
- Senhas DB nunca em código.
- Rate limit em `/auth/login` (5 req/min/IP).
- `helmet` global.
- HTTPS enforced em prod (mobile valida em `apiClient.ts`).
- `__DEV__`-gated logs detalhados.
- DB compartilhado: **sem `prisma migrate`**, só introspect.

## Gaps Conhecidos

1. **Avaliações `/evaluations` é stub.** Endpoints retornam arrays vazios. TODO em `evaluations.service.ts` lista as queries `.rule` legadas a traduzir (`getPeriodos`, `getTipoAvaliacoes`, `getAvaliacoes`, `getAlunosAvaliacao`, `postAlunosAvaliacao`, `getIndicadores`, `getAlunosIndicadores`, `postNotasIndicadores`).
2. **CalendarioEscolar é placeholder** — tela mostra mensagem "em construção". Sem endpoint mensal de dias letivos. Implementação futura.
3. **Pasta `apps/api/src/modules/legacy/`** vazia — propósito a definir (provavelmente proxy temporário a queries legadas).
4. **Prisma schema** — só `FrUsuario`. Outras consultas usam `$queryRaw` parametrizado. Type-safety vem dos tipos compartilhados em `shared-types`.
5. **Testes ausentes** — sem cobertura.
6. **CI/CD** — sem pipeline.
7. **Refresh tokens stateless** — sem revogação server-side. Logout só limpa tokens no cliente.

## Próximos Passos

1. Implementar queries reais em `apps/api/src/modules/evaluations/evaluations.service.ts` (substituir `return []` stubs).
2. Avaliar criação de endpoint mensal de calendário escolar e remover placeholder em `templates/calendarioEscolar/CalendarioEscolar.tsx`.
3. Adicionar testes unitários (services API + lib/crypto + lib/jwt).
4. Pipeline CI (`pnpm typecheck`, `pnpm lint`, `pnpm --filter @diariomobile/api build`).
5. Persistir refresh tokens (tabela própria + revogação).
6. Cache Redis em `/academic/*` (alta leitura).

## Comandos Úteis

```bash
# raiz
corepack pnpm install

# API
corepack pnpm api:dev
corepack pnpm --filter @diariomobile/api prisma:pull
corepack pnpm --filter @diariomobile/api prisma:generate

# Mobile
corepack pnpm mobile:start

# Cross
corepack pnpm typecheck
corepack pnpm lint
```
