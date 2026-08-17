import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

interface ApiClientOptions {
  timeout?: number;
  attachAuth?: boolean;
  handleAuthErrors?: boolean;
}

type SignOutHandler = () => Promise<void> | void;
type ToastHandler = (text1: string, type?: 'success' | 'error' | 'warning' | 'info', text2?: string) => void;
type RefreshHandler = () => Promise<string | null>;

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

const DEFAULT_TIMEOUT = 30000;

let signOutHandler: SignOutHandler | null = null;
let toastHandler: ToastHandler | null = null;
let refreshHandler: RefreshHandler | null = null;
let logoutScheduled = false;

export function registerApiInterceptors(opts: {
  signOut: SignOutHandler;
  showToast: ToastHandler;
  refresh: RefreshHandler;
}) {
  signOutHandler = opts.signOut;
  toastHandler = opts.showToast;
  refreshHandler = opts.refresh;
}

function isDevelopment() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function getApiBaseUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_URL_API?.trim();

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_URL_API nao configurada.');
  }

  const allowInsecureHttp = process.env.EXPO_PUBLIC_ALLOW_INSECURE_HTTP === 'true';

  if (apiUrl.startsWith('http://') && !allowInsecureHttp) {
    throw new Error(
      'EXPO_PUBLIC_URL_API deve usar HTTPS. Defina EXPO_PUBLIC_ALLOW_INSECURE_HTTP=true para permitir HTTP (apenas builds de homologacao/dev).'
    );
  }

  if (apiUrl.startsWith('http://') && !isDevelopment()) {
    console.warn(
      '[apiClient] AVISO: build de release usando HTTP. Trafego nao criptografado. Use apenas em ambiente de homologacao interno.'
    );
  }

  return apiUrl;
}

function scheduleLogout() {
  if (logoutScheduled) return;
  logoutScheduled = true;

  setTimeout(async () => {
    logoutScheduled = false;
    if (signOutHandler) {
      await signOutHandler();
    }
  }, 500);
}

export function logServiceError(context: string, error: unknown) {
  if (!isDevelopment()) return;

  if (axios.isAxiosError(error)) {
    console.error(context, {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    return;
  }

  console.error(context, error);
}

let cachedApiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!cachedApiClient) {
    cachedApiClient = createApiClient();
  }
  return cachedApiClient;
}

export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  const { timeout = DEFAULT_TIMEOUT, attachAuth = true, handleAuthErrors = true } = options;

  const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  if (attachAuth) {
    api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  if (isDevelopment()) {
    api.interceptors.request.use(
      (config) => {
        const method = (config.method || 'get').toUpperCase();
        const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
        const hasAuth = Boolean(config.headers?.Authorization);
        console.log(`[API →] ${method} ${fullUrl}${hasAuth ? ' (auth)' : ''}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
      (response) => {
        const method = (response.config.method || 'get').toUpperCase();
        const fullUrl = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
        console.log(`[API ←] ${response.status} ${method} ${fullUrl}`);
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (!handleAuthErrors) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      // Tenta refresh em 401 (uma vez)
      if (status === 401 && refreshHandler && originalConfig && !originalConfig._retry) {
        originalConfig._retry = true;
        const newAccess = await refreshHandler();
        if (newAccess) {
          originalConfig.headers.Authorization = `Bearer ${newAccess}`;
          return api.request(originalConfig);
        }
      }

      if (isDevelopment()) {
        console.error('[API ✗] Erro detalhado:', {
          status,
          url: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
          method: error.config?.method,
          serverMessage:
            (error.response?.data as { message?: string; error?: string } | undefined)?.message ||
            (error.response?.data as { message?: string; error?: string } | undefined)?.error ||
            error.response?.data,
          axiosMessage: error.message,
        });
      }

      if (status === 401 || status === 403) {
        if (toastHandler) {
          toastHandler('Sessão expirada!', 'error', 'Sua sessão expirou. Você será desconectado.');
        }
        scheduleLogout();
        return Promise.reject(error);
      }

      if (toastHandler && status && status >= 500) {
        toastHandler('Aconteceu um erro inesperado!', 'error', 'Por favor tente novamente mais tarde.');
      }

      return Promise.reject(error);
    }
  );

  return api;
}
