# DiarioMobile Monorepo

Workspace com app mobile Expo/React Native, API Fastify/Prisma e pacotes
compartilhados de tipos/schemas.

## Estrutura

```text
apps/
  api/        Fastify + Prisma + SQL Server
  mobile/     Expo React Native
packages/
  shared-schemas/  schemas zod compartilhados
  shared-types/    tipos TypeScript compartilhados
```

## Setup

```bash
corepack enable
pnpm install
pnpm --filter @diariomobile/api prisma:generate
```

Se o `corepack enable` nao tiver permissao na maquina, use `corepack pnpm ...`
no lugar de `pnpm ...`.

Copie os exemplos de ambiente antes de rodar:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

## Scripts

```bash
pnpm mobile:start       # expo start
pnpm api:dev            # fastify em watch mode
pnpm typecheck          # typecheck em todos os pacotes
pnpm lint               # lint recursivo
```

## API

A API inicial expoe:

- `GET /health`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /academic/years`
- `GET /academic/schools`
- `GET /academic/schools/:schoolId/classes`
- `GET /academic/schools/:schoolId/grades`
- `GET /academic/schools/:schoolId/subjects`
- `GET /academic/class-disciplines/:classDisciplineId/weekdays`
- `GET /academic/schools/:schoolId/upcoming-classes`
- `GET /diary/class-disciplines/:classDisciplineId/attendance`
- `PATCH /diary/attendance`
- `PATCH /diary/content/:diaryContentId`
- `GET /diary/class-disciplines/:classDisciplineId/content-history`
- `POST /diary/content/:diaryContentId/replicate`
- `GET /lesson-plans`
- `POST /lesson-plans`
- `PATCH /lesson-plans/:lessonPlanId`
- `DELETE /lesson-plans/:lessonPlanId`

O schema Prisma fica em `apps/api/prisma/schema.prisma` e aponta para o banco
legado SQL Server. Nao usar `prisma migrate` contra esse banco compartilhado;
use `pnpm --filter @diariomobile/api prisma:pull` para sincronizar o schema.
