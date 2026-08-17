import { isAxiosError } from 'axios';
import type { LoginResponse, RefreshResponse } from '@diariomobile/shared-types';
import { LoginRequestSchema } from '@diariomobile/shared-schemas';
import { createApiClient, logServiceError } from './apiClient';

export interface LoginResult {
    ok: boolean;
    data?: LoginResponse;
    errorMessage?: string;
}

function authClient() {
    return createApiClient({
        timeout: 15000,
        attachAuth: false,
        handleAuthErrors: false,
    });
}

export async function loginRequest(login: string, senha: string): Promise<LoginResult> {
    const parsed = LoginRequestSchema.safeParse({ login, senha });
    if (!parsed.success) {
        return { ok: false, errorMessage: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
    }

    let api;
    try {
        api = authClient();
    } catch (configError) {
        logServiceError('[Auth] Falha ao criar apiClient', configError);
        return {
            ok: false,
            errorMessage: configError instanceof Error ? configError.message : 'Configuração de API inválida.',
        };
    }

    try {
        const { data } = await api.post<LoginResponse>('/auth/login', parsed.data);
        return { ok: true, data };
    } catch (error) {
        logServiceError('[Auth] Falha no login', error);

        if (!isAxiosError(error)) {
            return { ok: false, errorMessage: error instanceof Error ? error.message : 'Erro desconhecido.' };
        }

        if (error.code === 'ECONNABORTED') {
            return { ok: false, errorMessage: 'O servidor demorou muito para responder. Verifique sua conexão.' };
        }

        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            return { ok: false, errorMessage: 'Não foi possível conectar ao servidor. Verifique sua internet.' };
        }

        const status = error.response?.status;
        const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;

        if (status === 401) {
            return { ok: false, errorMessage: serverMessage || 'Usuário ou senha não conferem.' };
        }
        if (status === 403) {
            return { ok: false, errorMessage: serverMessage || 'Conta bloqueada ou expirada.' };
        }

        const fallback = status ? `Erro ${status}. Tente novamente mais tarde.` : 'Erro de comunicação com o servidor.';
        return { ok: false, errorMessage: serverMessage || fallback };
    }
}

export async function refreshRequest(refreshToken: string): Promise<RefreshResponse | null> {
    try {
        const api = authClient();
        const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });
        return data;
    } catch (error) {
        logServiceError('[Auth] Falha no refresh', error);
        return null;
    }
}
