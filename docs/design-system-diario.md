# Design System — Diário

> Guia visual e estrutural pra replicar o layout **Élo** (do EduConecta) no
> projeto **Diário**. Mantém todas as funcionalidades já existentes do
> DiarioMobile, mas adota a linguagem visual + estrutura de componentes
> do Élo, rebrandado pra "Diário".
>
> **Filosofia base**: contraste alto, cores sólidas (sem gradientes pasteis),
> tipografia display distintiva (Outfit), assimetria intencional (bento
> grid), neutros quentes em vez de cinza azulado.

---

## 1. Paleta de cores

### Tokens primários

```ts
// src/constants/colors.ts
export const colors = {
  brand: {
    primary: '#FF6B35',      // Laranja queimado — hero / CTA principal
    primaryDark: '#E0511C',  // Pressed / borders
    primaryLight: '#FFE7D9', // Backgrounds tonais
    secondary: '#06B6D4',    // Teal — par dialógico
    secondaryDark: '#0E7490',
    secondaryLight: '#CFFAFE',
    accent: '#FCD34D',       // Amarelo — destaques alegres
    accentDark: '#D4A017',
  },

  // Neutros quentes (off-white em vez de cinza frio)
  ink: '#1F2937',          // Texto principal / contornos
  inkSoft: '#475569',      // Texto secundário
  paper: '#FAF8F4',        // Background base (off-white quente)
  paperWarm: '#F4EFE8',    // Cards alternativos / botões neutros
  hairline: '#E7E1D6',     // Bordas sutis

  // Estados
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#06B6D4',

  white: '#FFFFFF',
  black: '#000000',

  shadowColor: '#1F2937',
};
```

> **Customizar pro Diário**: trocar `brand.primary` por outra cor hero
> distintiva. Manter estrutura (hero / par dialógico / acento amarelo).
> Sugestão: azul-petróleo `#0E7490` como hero, laranja `#F97316` como par.

### Tailwind config

```js
// tailwind.config.js
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          'primary-dark': '#E0511C',
          'primary-light': '#FFE7D9',
          secondary: '#06B6D4',
          'secondary-dark': '#0E7490',
          'secondary-light': '#CFFAFE',
          accent: '#FCD34D',
          'accent-dark': '#D4A017',
        },
        ink: { DEFAULT: '#1F2937', soft: '#475569' },
        paper: { DEFAULT: '#FAF8F4', warm: '#F4EFE8' },
        hairline: '#E7E1D6',
      },
      fontFamily: {
        display: ['Outfit-Bold', 'sans-serif'],
        sans: ['Outfit-Regular', 'sans-serif'],
        medium: ['Outfit-Medium', 'sans-serif'],
        semibold: ['Outfit-SemiBold', 'sans-serif'],
      },
      borderRadius: { '4xl': '32px', '5xl': '40px' },
      boxShadow: {
        playful: '0 8px 24px rgba(255, 107, 53, 0.18)',
      },
    },
  },
  plugins: [],
};
```

### Regra de uso

| Uso | Cor |
|---|---|
| CTA principal / botão primário | `brand.primary` |
| Hero cards (full-bleed) | `brand.primary` sólido |
| Cards regulares | `white` + `borderColor: hairline` |
| Backgrounds alternativos | `paperWarm` |
| Background app | `paper` |
| Texto principal | `ink` |
| Texto secundário | `inkSoft` |
| Bordas sutis | `hairline` |
| Tabs ativa | `brand.primary` |
| Pílulas/badges informativas | tonais (`primaryLight` + `primaryDark`) |
| Destaques alegres (entrada de presença, sucesso animado) | `brand.accent` |
| Estado erro | `error` |
| Estado sucesso | `success` |

---

## 2. Tipografia

### Fonte principal: Outfit

Instalar:

```bash
npx expo install @expo-google-fonts/outfit expo-font
```

Carregar em `App.tsx`:

```tsx
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

const [fontsLoaded] = useFonts({
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
});
if (!fontsLoaded) return null;
```

### Escala tipográfica

| Uso | Family | Size | Letter spacing | Line height |
|---|---|---|---|---|
| Display (heros) | `Outfit_700Bold` | 26-32 | -1 | 30-34 |
| Header título | `Outfit_700Bold` | 22 | -0.5 | — |
| Card título | `Outfit_700Bold` | 16-18 | -0.3 | — |
| Body | `Outfit_400Regular` | 14 | 0 | 20 |
| Secondary | `Outfit_400Regular` | 12 | 0 | 16 |
| Pílula/Badge (UPPERCASE) | `Outfit_600SemiBold` | 11 | 0.5 | — |
| Tab ativa | `Outfit_600SemiBold` | 13 | -0.2 | — |
| Número grande (frequência %) | `Outfit_700Bold` | 32-48 | -1.5 | — |

---

## 3. Espaçamentos, raios, sombras

### Espaçamento base

| Token | Px | Uso |
|---|---|---|
| `xs` | 4 | gap entre pílulas |
| `sm` | 8 | gap horizontal pequeno |
| `md` | 12 | padding interno padrão |
| `lg` | 16 | padding card interno |
| `xl` | 22 | padding hero card |
| `2xl` | 28 | margens entre seções |

### Border radius

| Componente | Radius |
|---|---|
| Pílula / badge | `999` (fully rounded) |
| Botão | `16-24` |
| Card padrão | `20-24` |
| Card hero | `28` |
| BottomNav container | `32` |
| Avatar (não circular) | `18` |
| Avatar circular | `999` |

### Sombras

**Padrão sutil** (cards normais):
- iOS: `shadowColor: ink, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }`
- Android: `elevation: 2`

**Playful** (CTA, hero, BottomNav):
- iOS: `shadowColor: brand.primary, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }`
- Android: `elevation: 14`

> Hero cards (laranja sólido) geralmente **não** têm sombra — contraste
> de cor já cria peso visual suficiente.

---

## 4. Componentes core

### 4.1 Header (telas internas)

```tsx
// src/components/Header.tsx
<View style={{
  backgroundColor: colors.paper,
  paddingTop: insets.top + 8,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
}}>
  <StatusBar style="dark" backgroundColor="transparent" translucent />
  <View className="flex-row items-center px-5">
    {/* Botão voltar — círculo paperWarm */}
    <TouchableOpacity
      onPress={handleGoBack}
      className="w-11 h-11 items-center justify-center rounded-full"
      style={{ backgroundColor: colors.paperWarm }}
    >
      <Feather name="arrow-left" size={20} color={colors.ink} />
    </TouchableOpacity>

    {/* Título */}
    <View className="flex-1 ml-3">
      <Text style={{
        fontFamily: 'Outfit_700Bold',
        fontSize: 22,
        color: colors.ink,
        letterSpacing: -0.5,
      }}>{title}</Text>
    </View>

    {/* MenuButton (acessa MenuSheet global) */}
    <MenuButton />
  </View>
</View>
```

**Características**:
- Paper background (off-white quente)
- Sem sombra (border-bottom 1px hairline)
- Botão voltar = círculo 44px paperWarm com ícone ink
- Título em display (Outfit Bold 22, letter-spacing -0.5)
- Sempre tem `MenuButton` no canto direito (drawer global)

### 4.2 BottomNavigation — pill nav flutuante

```tsx
// src/components/BottomNavigation.tsx
const TABS = [
  { route: 'HomeScreen', label: 'Início', icon: 'home' },
  { route: 'BoletimEscolarScreen', label: 'Notas', icon: 'bar-chart-2' },
  { route: 'CalendarioEscolarScreen', label: 'Agenda', icon: 'calendar' },
  { route: 'MuralAvisosScreen', label: 'Avisos', icon: 'bell' },
  { route: 'SolicitacoesScreen', label: 'Mais', icon: 'grid' },
];
```

**Comportamento**:
- Tab **inativa**: ícone só, 48x48px, transparent
- Tab **ativa**: "infla" pra pílula (flex: 1, brand.primary, ícone + label)
- Container: paper, rounded-32, sombra colorida laranja (`shadowOpacity: 0.25`)
- Position absolute bottom, 12px lateral, hairline border

### 4.3 MenuSheet — drawer global

Bottom sheet modal acionado por `MenuButton` no header. Lista TODOS os
domínios do app com:

- Ícone tonal grande (cor por domínio)
- Label claro
- Descrição curta

```tsx
const ITEMS = [
  { icon: 'home',         label: 'Início',       desc: 'Resumo + atalhos',           tint: '#FF6B35' },
  { icon: 'bar-chart-2',  label: 'Boletim',      desc: 'Notas e situação',           tint: '#7C3AED' },
  { icon: 'check-circle', label: 'Frequência',   desc: 'Calendário presenças',       tint: '#16A34A' },
  { icon: 'calendar',     label: 'Calendário',   desc: 'Atividades + dias letivos',  tint: '#0EA5E9' },
  { icon: 'clock',        label: 'Horários',     desc: 'Grade semanal',              tint: '#F97316' },
  { icon: 'book',         label: 'Conteúdo',     desc: 'Cronograma matérias',        tint: '#06B6D4' },
  { icon: 'bell',         label: 'Avisos',       desc: 'Mural escola',               tint: '#FCD34D' },
  { icon: 'alert-circle', label: 'Ocorrências',  desc: 'Comportamento',              tint: '#DC2626' },
  // ... domínios do Diário aqui
];
```

Provider em `App.tsx`. Hook `useMenuSheet().open()` pra acionar.

### 4.4 AlunoCard — card de identificação

```tsx
<View className="mx-4 mt-4 p-4 flex-row items-center"
  style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.hairline,
  }}>
  {/* Avatar 56x56 brand.primary com inicial branca */}
  <View className="w-14 h-14 items-center justify-center mr-4"
    style={{ backgroundColor: colors.brand.primary, borderRadius: 18 }}>
    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFFFFF' }}>
      {inicial}
    </Text>
  </View>

  {/* Nome + pílulas */}
  <View className="flex-1">
    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: colors.ink }}>
      {nome}
    </Text>
    <View className="flex-row flex-wrap mt-2 gap-2">
      <Pill text="9º Ano • A" variant="primary" />
      <Pill text="Vespertino" variant="secondary" />
      <Pill text="2026" variant="accent" />
    </View>
  </View>
</View>
```

### 4.5 Pill — badge informativo

3 variantes (primary/secondary/accent), todas em tons leves:

```tsx
function Pill({ text, variant = 'primary' }) {
  const palette = {
    primary:   { bg: colors.brand.primaryLight,   fg: colors.brand.primaryDark },
    secondary: { bg: colors.brand.secondaryLight, fg: colors.brand.secondaryDark },
    accent:    { bg: '#FFF5C8',                   fg: colors.brand.accentDark },
  }[variant];
  return (
    <View style={{ backgroundColor: palette.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: palette.fg, fontFamily: 'Outfit_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {text}
      </Text>
    </View>
  );
}
```

### 4.6 NotificacoesBellButton — sino com badge

```tsx
<TouchableOpacity className="w-10 h-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
  <Feather name="bell" size={20} color="white" />
  {count > 0 && (
    <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full items-center justify-center border-2 border-white">
      <Text className="text-white text-[10px] font-bold">{count > 99 ? '99+' : count}</Text>
    </View>
  )}
</TouchableOpacity>
```

Hook `useNotificacoesNaoLidas()` polla a cada 30s + refresh on focus.

### 4.7 Forms

Library de inputs em `src/components/forms/`:

- `FormInput` — text input + label + error
- `FormSelect` — dropdown
- `FormSwitch` — toggle on/off com label
- `Button` — primário/secundário/disabled
- `ActionCards` — cards clicáveis com ícone tonal
- `Upload` — file/image picker
- `FormContainer` — wrapper padrão

---

## 5. Padrões de layout

### 5.1 Hero card (HomeScreen card aluno)

Card laranja sólido full-bleed:
- `backgroundColor: brand.primary`
- `borderRadius: 28`
- `padding: 22`
- Label uppercase com `color: rgba(255,255,255,0.85)`, `letterSpacing: 1.5`
- Nome grande Outfit_700Bold 26, `letterSpacing: -1`
- Pílulas brancas `rgba(255,255,255,0.2)` com texto branco
- Footer: nome escola `rgba(255,255,255,0.75)`, fontSize 12

### 5.2 Bento grid — assimetria intencional

Home: 2 colunas com cards de altura/proporção diferente:

```
┌──────────────────────────────────┐
│        Hero Card Aluno           │
│        (laranja, full-width)     │
└──────────────────────────────────┘
┌─────────────────┬────────────────┐
│   Frequência    │                │
│   95% • Card    │   Próxima      │
│   colorido      │   Atividade    │
└─────────────────┤                │
┌─────────────────┤   (tile alto)  │
│ Atalhos chips   │                │
│ horizontal scrl │                │
└─────────────────┴────────────────┘
┌──────────────────────────────────┐
│        Mural (compact list)      │
└──────────────────────────────────┘
```

### 5.3 Status tonal — frequência

3 tons baseados em valor:

| Estado | Faixa | bg | fg | Ícone |
|---|---|---|---|---|
| `good` | >= 80% | `#DCFCE7` (green-100) | `success` | `check-circle` |
| `warn` | 75-80% | `#FED7AA` (orange-100) | `warning` | `alert-triangle` |
| `bad` | < 75% | `#FEE2E2` (red-100) | `error` | `alert-circle` |

### 5.4 Listas e tabelas

- **Mural / Avisos**: cards brancos, hairline border, padding 16, gap 12 entre
- **Boletim**: tabela com coluna fixa "Disciplina" (esquerda, 180px) + colunas scrolláveis horizontal (bimestres, médias, faltas)
- **Frequência**: grid 7 colunas (dias da semana) com bolinhas coloridas por status

### 5.5 Empty states

Sempre com:
- Ícone Feather tonal (50x50, bg paperWarm rounded-full)
- Título Outfit_700Bold 16
- Descrição secundária Outfit_400Regular 14 inkSoft

### 5.6 Skeletons

Componente `Skeleton` reusável com shimmer animation. Larguras/alturas
em px ou %. Mantém estrutura visual durante load.

---

## 6. Navegação

### 6.1 Stack root

```tsx
// src/routes/index.tsx
<NavigationContainer>
  <MenuSheetProvider>
    <NotificationBootstrap />
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
          {/* outras screens fora do tab bar */}
        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="PrimeiroAcessoScreen" component={PrimeiroAcessoScreen} />
        </>
      )}
    </Stack.Navigator>
  </MenuSheetProvider>
</NavigationContainer>
```

### 6.2 AppTabs

```tsx
<Tab.Navigator
  tabBar={(props) => <BottomNavigation {...props} />}
  screenOptions={{ headerShown: false }}
>
  <Tab.Screen name="HomeScreen" component={HomeScreen} />
  <Tab.Screen name="BoletimEscolarScreen" component={BoletimEscolarScreen} />
  <Tab.Screen name="CalendarioEscolarScreen" component={CalendarioEscolarScreen} />
  <Tab.Screen name="MuralAvisosScreen" component={MuralAvisosScreen} />
  <Tab.Screen name="SolicitacoesScreen" component={SolicitacoesScreen} />
</Tab.Navigator>
```

### 6.3 Acesso a outras telas

Tabs no BottomNav = 5 principais. Demais telas (Frequência, Horários,
Conteúdo, Ocorrências, Autorizações, Notificações, etc.) acessadas via:

- **MenuSheet** (botão no Header)
- **Atalhos chips** na HomeScreen
- **Stack navigate** programático

---

## 7. Estrutura de pastas (sugerida)

Replicar layout do `app/elo`:

```
src/
├── components/
│   ├── BottomNavigation.tsx     # Pill nav flutuante
│   ├── Header.tsx               # Header padrão telas internas
│   ├── MenuSheet.tsx            # Drawer global + Provider + hook
│   ├── AlunoCard.tsx            # ou equivalente Diário
│   ├── NotificacoesBellButton.tsx
│   ├── NotificationBootstrap.tsx
│   ├── Skeleton.tsx
│   ├── OcorrenciaPendenteModal.tsx  # ou equivalente Diário
│   └── forms/
│       ├── Button.tsx
│       ├── FormInput.tsx
│       ├── FormSelect.tsx
│       ├── FormSwitch.tsx
│       ├── FormContainer.tsx
│       ├── ActionCards.tsx
│       └── Upload.tsx
├── constants/
│   └── colors.ts                # Paleta + componentColors
├── context/
│   ├── AlertContext.tsx         # showAlert / showToast / showConfirm
│   ├── AuthContext.tsx          # JWT + signIn/signOut
│   ├── LoadingContext.tsx       # Overlay loading global
│   └── <DominioContext>.tsx     # Ex: AlunoContext
├── hooks/
│   ├── useNotificacoesNaoLidas.ts
│   ├── useExpoPushToken.ts
│   └── useNotificationListener.ts
├── lib/
│   └── notifications.ts         # gate Expo Go (dynamic require)
├── navigation/
│   └── AppTabs.tsx              # Tab.Navigator + types
├── routes/
│   └── index.tsx                # Stack + AuthProvider lógica
├── screens/
│   ├── home/
│   ├── notificacoes/
│   └── <demais>/
├── services/
│   ├── api.tsx                  # axios cliente principal
│   ├── apiNotifications.tsx     # se houver backend separado
│   ├── notificacoes/
│   ├── pushTokens/
│   └── <demais>/
├── styles/
│   └── global.css               # NativeWind
└── util/
    ├── FormatarNome.tsx
    ├── FormatDate.tsx
    ├── RemoverTagsHtml.tsx
    ├── cn.tsx                   # clsx + tailwind-merge
    ├── mask.tsx
    └── validate.ts
```

---

## 8. App.tsx — bootstrap

```tsx
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from './src/context/AlertContext';
import { AuthProvider } from './src/context/AuthContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { Routes } from './src/routes';
import { colors } from './src/constants/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <LoadingProvider>
          <AuthProvider>
            <StatusBar style="dark" backgroundColor={colors.paper} />
            <Routes />
          </AuthProvider>
        </LoadingProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
```

---

## 9. Princípios de design

1. **Cores sólidas, não gradientes**. Hero card laranja chapado. Não usar
   linear-gradient azul→roxo.
2. **Tipografia distintiva (Outfit)**. Letter-spacing negativo em displays.
   UPPERCASE com letter-spacing positivo em micro-copy.
3. **Off-white quente, não cinza azulado**. `#FAF8F4` em vez de `#F1F5F9`.
4. **Assimetria intencional**. Bento grid 2 col com tiles de proporções
   diferentes. Pílula nav infla na tab ativa.
5. **Bordas sutis (hairline 1px)**, não sombras dramáticas.
6. **Sombras coloridas em CTAs/heros** — laranja transluzido em
   `shadowColor`.
7. **Tonais para badges/pílulas** — `primaryLight` + `primaryDark`
   sempre juntos.
8. **Acessibilidade**: textos pequenos (11px) só em UPPERCASE com bold
   + letter-spacing pra legibilidade.
9. **Linguagem clara pra leigos**. Cada item do menu tem descrição
   curta ("Cronograma de matérias" em vez de só "Conteúdo").
10. **Pílulas (border-radius 999) > retângulos arredondados** sempre que
    espaço permite.

---

## 10. Plano de migração — passo a passo

### Pré-requisitos

- DiarioMobile já usa Expo + React Native + NativeWind
- React Navigation 7 (native-stack + bottom-tabs)
- `react-native-safe-area-context`
- `@expo/vector-icons` (Feather)

### Passos

1. **Instalar fonte**:
   ```bash
   npx expo install @expo-google-fonts/outfit expo-font
   ```

2. **Copiar/criar `src/constants/colors.ts`** com a paleta do Diário
   (decida cor hero diferente do laranja Élo se quiser distinção).

3. **Atualizar `tailwind.config.js`** com tokens brand + fontFamily.

4. **Copiar componentes base**:
   - `Header.tsx`
   - `BottomNavigation.tsx`
   - `MenuSheet.tsx` (+ Provider)
   - `Skeleton.tsx`
   - `NotificacoesBellButton.tsx` (se aplicável)
   - `forms/*`

5. **Refatorar Stack/Tabs** em `routes/index.tsx` + `navigation/AppTabs.tsx`
   pra usar `BottomNavigation` custom + `MenuSheetProvider`.

6. **Atualizar `App.tsx`** com `useFonts` + providers na ordem correta.

7. **Refatorar HomeScreen** pra layout bento:
   - Topbar minimal (saudação + sino + sair)
   - Hero card aluno laranja
   - Bento grid 2 col
   - Tira atalhos horizontal
   - Mural compact

8. **Refatorar telas internas** (Boletim, Frequência, etc.) usando:
   - `<Header title="..." />` padrão
   - Cards brancos com hairline border
   - Pílulas tonais
   - Empty/error states padronizados

9. **Auditar telas existentes** do Diário pra:
   - Trocar `StyleSheet` por `className` (NativeWind) onde aplicável
   - Aplicar tipografia Outfit
   - Trocar cinzas frios por neutros quentes
   - Remover gradientes pasteis

10. **Manter funcionalidades**:
    - Não mexer em services / lógica de negócio / context state
    - Apenas trocar UI components e estilos
    - Validar que fluxos continuam funcionando após cada tela migrada

---

## 11. Diferenças propostas — Élo vs Diário

> Sugestões pra distinguir Diário visualmente do Élo. Adapte conforme
> identidade do projeto.

| Aspecto | Élo (origem) | Diário (sugestão) |
|---|---|---|
| Hero color | Laranja `#FF6B35` | Azul-petróleo `#0E7490` |
| Par dialógico | Teal `#06B6D4` | Laranja `#F97316` |
| Acento | Amarelo `#FCD34D` | Verde-limão `#84CC16` |
| Wordmark | "Élo" com `o` amarelo | "Diário" com acento sobre `a` |
| Vibe | Lúdica / educacional | Confiável / estudo-focado |
| Background | Off-white quente `#FAF8F4` | Off-white frio levemente azul `#F8FAFC` (mais "papel caderno") |

Manter estrutura, componentes, tipografia. Trocar só tokens de cor +
wordmark.

---

## 12. Referências do código fonte (Élo)

> Arquivos consultáveis em `C:/projetos/EduConecta/app/elo/`:

- `src/constants/colors.ts` — paleta completa
- `tailwind.config.js` — tokens Tailwind
- `src/components/Header.tsx` — header padrão
- `src/components/BottomNavigation.tsx` — pill nav
- `src/components/MenuSheet.tsx` — drawer global
- `src/components/AlunoCard.tsx` — card identificação
- `src/components/NotificacoesBellButton.tsx` — sino + badge
- `src/screens/home/HomeScreen.tsx` — exemplo bento grid
- `src/screens/boletim/BoletimEscolarScreen.tsx` — exemplo tabela
- `src/routes/index.tsx` — stack + providers
- `src/navigation/AppTabs.tsx` — tab nav config
- `App.tsx` — bootstrap + fonts

---

## Apêndice — Cheat sheet

### Card padrão (branco)

```tsx
<View style={{
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: colors.hairline,
  padding: 16,
}}>
```

### Card hero (brand)

```tsx
<View style={{
  backgroundColor: colors.brand.primary,
  borderRadius: 28,
  padding: 22,
}}>
```

### Pílula (tonal)

```tsx
<View style={{
  backgroundColor: colors.brand.primaryLight,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
}}>
  <Text style={{
    color: colors.brand.primaryDark,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }}>{text}</Text>
</View>
```

### Botão círculo (back / icon)

```tsx
<TouchableOpacity
  className="w-11 h-11 items-center justify-center rounded-full"
  style={{ backgroundColor: colors.paperWarm }}
>
  <Feather name="arrow-left" size={20} color={colors.ink} />
</TouchableOpacity>
```

### Número grande (frequência %)

```tsx
<Text style={{
  fontFamily: 'Outfit_700Bold',
  fontSize: 48,
  color: colors.brand.primary,
  letterSpacing: -1.5,
}}>{percentual}%</Text>
```

### Display title (header / hero)

```tsx
<Text style={{
  fontFamily: 'Outfit_700Bold',
  fontSize: 22,
  color: colors.ink,
  letterSpacing: -0.5,
}}>{title}</Text>
```
