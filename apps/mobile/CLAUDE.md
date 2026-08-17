# CLAUDE.md — Regras do Projeto DiarioMobile

> Carregado automaticamente em toda sessão. Mantenha curto. Detalhes de arquitetura/estrutura → `CONTEXT.md`.

## Contexto do Projeto
**Sempre consultar [CONTEXT.md](./CONTEXT.md) antes de explorar pastas.** Contém: stack, estrutura de diretórios, domínio, navegação, convenções. Evita `Glob`/`Grep` redundante e economiza tokens. Atualizar `CONTEXT.md` quando estrutura mudar significativamente.

## Modo de Comunicação
- **CAVEMAN MODE sempre ativo (full).** Toda resposta minha em estilo caveman: sem artigos, sem fluff, sem pleasantries, sem hedging. Fragmentos OK. Termos técnicos exatos.
- Exceções (escrita normal): código, mensagens de commit, descrição de PR, avisos de segurança, confirmações de ação destrutiva, sequências multi-step com risco de leitura ambígua.
- Se eu pedir "stop caveman" ou "normal mode" → reverte. Restante da sessão volta após parte clara.
- Skill ref: `caveman:caveman` (já carregada via SessionStart hook).

## Fluxo de Trabalho
- **Planejar antes de executar** em tarefas não-triviais. Não-trivial = múltiplos arquivos, refatorações, novas features, mudanças de arquitetura, bugs com causa não óbvia.
- Tarefa simples (1 arquivo, edição localizada, pergunta direta) → executar direto.
- Plano = passos numerados curtos antes de tocar código. Esperar OK do usuário se mudança grande/irreversível.
- Usar `TodoWrite` p/ rastrear passos quando >3 etapas.
- Skills relevantes: `superpowers:writing-plans`, `superpowers:brainstorming`, `superpowers:systematic-debugging`, `superpowers:test-driven-development`.

## Idioma
- Respostas ao usuário: **Português** (pt-BR).
- Código, commits, comentários técnicos: padrão do projeto (mistura pt-BR/inglês — seguir contexto do arquivo).

## Convenções de Código (resumo — detalhes em CONTEXT.md)
- TypeScript strict. Sem `any` salvo último recurso.
- NativeWind (`className=`) p/ estilo. Não criar `StyleSheet` salvo necessidade real.
- Path aliases: `templates/`, `components/`, `navigation/` (definidos em `tsconfig.json`).
- API: usar `createApiClient()` de `src/services/apiClient.ts`. Não duplicar tratamento 401/403/toast.
- Token: `expo-secure-store` chave `"token"`. Nunca `AsyncStorage`.
- Env: prefixo `EXPO_PUBLIC_*`.
- Lint/format antes de finalizar: `npm run lint`.

## Segurança
- Nunca commitar `.env`, credenciais, tokens.
- HTTPS obrigatório em prod (já enforced em `apiClient.ts`).
- Não logar dados sensíveis em prod (já gated por `__DEV__`).
- Validar input em boundaries (forms, params de navegação).

## Git
- Commits novos > amend (preservar histórico).
- Nunca `--no-verify` ou `--force` sem ordem explícita.
- Mensagem commit: seguir estilo do repo (ver `git log`). Conventional commits aceito.
- Não commitar sem pedido explícito do usuário.

## O Que Não Fazer
- Não criar `README.md` ou docs novos sem pedido.
- Não adicionar comentários óbvios. Só comentar o "porquê" não-óbvio.
- Não introduzir abstrações prematuras. 3 linhas similares > abstração precoce.
- Não adicionar error handling defensivo p/ casos impossíveis.
- Não alterar `app.json`/`eas.json`/config sem confirmar.
