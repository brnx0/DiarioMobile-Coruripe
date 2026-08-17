/**
 * Usuario autenticado retornado pela API.
 */
export interface AuthUser {
    id: number;
    login: string;
    nome: string;
    email: string | null;
    pesCod: number | null;
}

/**
 * Payload do access token (curto — 15min).
 */
export interface JwtAccessPayload {
    sub: number;
    login: string;
    nome: string;
    iat?: number;
    exp?: number;
}

/**
 * Payload do refresh token (longo — 7 dias).
 */
export interface JwtRefreshPayload {
    sub: number;
    iat?: number;
    exp?: number;
}

/**
 * Resposta do endpoint /auth/login.
 */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

/**
 * Resposta do endpoint /auth/refresh.
 */
export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

/**
 * Codigos de erro retornados pelo modulo auth.
 */
export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_EXPIRED' | 'INVALID_REFRESH';
