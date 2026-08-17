// @ts-ignore
/// <reference types="nativewind/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Adicione a nova variável aqui:
    readonly EXPO_PUBLIC_URL_API: string;
    readonly EXPO_PUBLIC_SYS_COD: string;
    readonly EXPO_PUBLIC_ALLOW_INSECURE_HTTP?: string;
    // Opcional: manter as outras variáveis do Expo
    readonly EXPO_PUBLIC_APP_ENV: string;
    // ...
  }
}
