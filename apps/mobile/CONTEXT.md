# CONTEXT.md — Mapa do Projeto DiarioMobile

> Referenciado por CLAUDE.md. Evita exploração redundante. Atualizar quando estrutura mudar.

## Stack
- **Runtime:** Expo SDK 54, React Native 0.81.5, React 19.1
- **Linguagem:** TypeScript 5.9 (strict)
- **Estilo:** NativeWind (Tailwind 3.4) + `global.css`
- **Navegação:** `@react-navigation/native` v7 (native-stack + bottom-tabs)
- **HTTP:** axios (singleton em `src/services/apiClient.ts`)
- **Storage seguro:** `expo-secure-store` (token JWT)
- **Auth:** JWT (`jwt-decode`) — token em SecureStore chave `"token"`
- **Toast:** `react-native-toast-message` (via `AlertContext`)
- **Icons:** `lucide-react-native` + `@expo/vector-icons`
- **Calendário:** `react-native-calendars`

## Scripts (package.json)
- `npm start` → `expo start`
- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` → eslint + prettier check
- `npm run format` → eslint --fix + prettier --write
- `npm run prebuild` → `expo prebuild`

## Arquitetura

### Camadas (clean code)
1. **`App.tsx`** — providers tree (SafeAreaProvider → AlertProvider → SelectionProvider → Routes).
2. **`src/routes/index.tsx`** — `AuthProvider` + `MainNavigator` (decide Login vs AppTabs por `user`). Splash de pré-carregamento (carrega escolas após login).
3. **`src/navigation/AppTabs.tsx`** — bottom tabs com sub-stacks pra Turmas e Planos.
4. **`components/BottomNavigation.tsx`** — `tabBar` custom com animações.

### Contexts (substitui prop drilling + variáveis globais)
- **`src/context/AlertContext.tsx`** — `useAlert().showToast(text, type, text2)`.
- **`src/context/AuthContext.tsx`** — `useAuth().{ user, signIn, signOut, loading }`. Carrega user do SecureStore, decodifica JWT. Registra interceptors no apiClient.
- **`src/context/SelectionContext.tsx`** — `useSelection().{ escolas, selectedEscola, turmas, selectedTurma, selectEscola, selectTurma, preCarregarEscolas, ... }`. Filtros globais (escola/turma) — telas-filho lêem aqui em vez de receber params.

## Estrutura de Pastas
```
.
├── App.tsx                    # Providers + Routes
├── app.json                   # Config Expo
├── eas.json                   # Config EAS Build
├── babel.config.js            # Babel (NativeWind preset)
├── metro.config.js            # Metro
├── tailwind.config.js         # Tailwind/NativeWind
├── tsconfig.json              # Path aliases
├── global.css                 # Tailwind base
├── .env.example               # EXPO_PUBLIC_URL_API, EXPO_PUBLIC_SYS_COD, EXPO_PUBLIC_ALLOW_INSECURE_HTTP
│
├── assets/                    # Fontes, ícones, padrões
│
├── components/
│   ├── BottomNavigation.tsx   # tabBar custom (animado)
│   ├── AnoPicker.tsx · DataPicker.tsx · DateSelectionModal.tsx
│   ├── DisciplinaPicker.tsx · TurmaPicker.tsx · GenericPicker.tsx
│   ├── JustificationModal.tsx · ListaEscolas.tsx (SchoolPicker)
│   ├── LoadingSave.tsx · LoadingScreen.tsx
│   ├── Lookup.tsx · Select.tsx · StyledDateInput.tsx
│
├── src/
│   ├── constants/colors.ts
│   ├── context/               # Estado global
│   │   ├── AlertContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── SelectionContext.tsx
│   ├── routes/
│   │   └── index.tsx          # Routes — auth gate + splash
│   ├── navigation/
│   │   └── AppTabs.tsx        # Bottom tabs + sub-stacks
│   ├── services/              # Camada API (axios singleton)
│   │   ├── apiClient.ts       # createApiClient + getApiClient + registerApiInterceptors
│   │   ├── Auth.ts            # signIn (sem state, recebe callback)
│   │   ├── AvaliacoesService.ts · CalendarioEscolarService.ts
│   │   ├── PlanoAulasService.ts · ProximasAulasService.ts
│   │   ├── ReplicarConteudoService.tsx · TurmaService.ts
│   └── util/
│       ├── FormatDate.tsx · NormalizarString.tsx
│
└── templates/                 # Telas (lêem context, sem prop drilling)
    ├── login/Login.tsx        # usa useAuth().signIn
    ├── home/                  # Home + CustomHeader + ProfileMenuDropdown
    ├── calendarioEscolar/CalendarioEscolar.tsx
    ├── ProximasAulas/ProximasAulas.tsx
    ├── planosAulas/           # ListaPlanosAulas (lê context) + PlanosAulas (form, params op)
    └── turmas/                # AttendanceList, AvaliacoesTab, ConteudoMetodologia,
                               # LancamentoNotas, ReplicarConteudo (params op),
                               # SegmentedControlTabs, TurmasDetails (lê context)
```

## Domínio
App diário escolar — professor lança presença, notas, conteúdo/metodologia, planos de aula. Multi-escola, multi-turma, multi-disciplina.

### Entidades
- **Escola** (`ESC_COD`)
- **Turma** (`TMD_COD` = turma+disciplina, `TURMA_COD` = turma pura)
- **Disciplina** (`DIS_COD`)
- **PlanoAulas** (tipo `PlanoAulasAPI` em `PlanoAulasService.ts`)
- **Avaliação / Nota / Presença**

### Navegação
```
Routes (auth gate)
├── (não logado) → Login
└── (logado) → AppTabs
    ├── HomeTab (Home — pickers + dashboard)
    ├── TurmasTab → TurmasStack
    │   ├── TurmasDetailsScreen (lê selectedTurma)
    │   └── ReplicarConteudo (params op CRUD)
    ├── PlanosTab → PlanosStack
    │   ├── ListaPlanosAulasScreen (lê selectedEscola)
    │   └── PlanosAulasScreen (params: planoAula? — edit vs novo)
    ├── CalendarioTab (CalendarioEscolar — lê selectedTurma)
    └── AulasTab (ProximasAulas — lê selectedEscola)
```

## Convenções
- **Path aliases:** `templates/*`, `components/*`, `@/*` resolvidos via `tsconfig.json`.
- **Estilo:** classes Tailwind via `className` (NativeWind). Não usar `StyleSheet` salvo casos específicos.
- **API:** `getApiClient()` (singleton) — services não duplicam interceptors. Interceptors auth/erro registrados via `registerApiInterceptors(signOut, showToast)` no AuthContext.
- **Token:** sempre `SecureStore.getItemAsync('token')`. Header `Authorization: <token-puro>` (sem prefixo Bearer).
- **Env:** vars públicas com prefixo `EXPO_PUBLIC_*`.
- **HTTPS obrigatório** em prod (HTTP só com `EXPO_PUBLIC_ALLOW_INSECURE_HTTP=true` em dev).
- **Filtros globais (escola/turma) via `useSelection()`** — não passa em params de rota.
- **Operações CRUD com params** (PlanosAulas form, ReplicarConteudo) — params são da operação, não filtro global.
- **Toast via `useAlert().showToast()`** (não chamar `Toast.show` direto em componentes).
- **Empty state** — telas que dependem de seleção mostram placeholder se `selectedEscola`/`selectedTurma` ausente.
- **Lint:** eslint flat config + prettier + tailwind plugin.

## Segurança
- Token JWT em SecureStore.
- HTTPS enforced em prod.
- Auto-logout em 401/403 (apiClient interceptor → AuthContext.signOut).
- Logs detalhados só em `__DEV__` (`logServiceError`, `[API →]`, `[API ←]`, `[API ✗]`).
