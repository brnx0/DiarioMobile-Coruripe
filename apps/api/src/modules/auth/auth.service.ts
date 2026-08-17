import type { PrismaClient } from '@prisma/client';
import { verifyLegacyPassword } from '../../lib/crypto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import type { AuthUser, LoginResponse } from '@diariomobile/shared-types';

export class AuthError extends Error {
    constructor(
        public code: 'INVALID_CREDENTIALS' | 'ACCOUNT_EXPIRED' | 'INVALID_REFRESH',
        public httpStatus: number,
        message: string,
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export class AuthService {
    constructor(private prisma: PrismaClient) { }

    async login(login: string, senha: string): Promise<LoginResponse> {
        const user = await this.prisma.frUsuario.findFirst({
            where: { USR_LOGIN: login },
        });

        if (!user || !user.USR_SENHA) {
            throw new AuthError('INVALID_CREDENTIALS', 401, 'Usuario ou senha invalidos.');
        }

        const senhaOk = verifyLegacyPassword(user.USR_CODIGO, senha, user.USR_SENHA);
        if (!senhaOk) {
            throw new AuthError('INVALID_CREDENTIALS', 401, 'Usuario ou senha invalidos.');
        }

        if (this.isAccountExpired(user.USR_TIPO_EXPIRACAO, user.USR_INICIO_EXPIRACAO, user.USR_DIAS_EXPIRACAO)) {
            throw new AuthError('ACCOUNT_EXPIRED', 403, 'Conta expirada. Procure o suporte.');
        }

        const authUser: AuthUser = {
            id: user.USR_CODIGO,
            login: user.USR_LOGIN,
            nome: user.USR_NOME,
            email: user.USR_EMAIL ?? null,
            pesCod: user.PES_COD ?? null,
        };

        const accessToken = signAccessToken({
            sub: user.USR_CODIGO,
            login: user.USR_LOGIN,
            nome: user.USR_NOME,
        });

        const refreshToken = signRefreshToken({
            sub: user.USR_CODIGO,
        });

        return { accessToken, refreshToken, user: authUser };
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new AuthError('INVALID_REFRESH', 401, 'Refresh token invalido ou expirado.');
        }

        const user = await this.prisma.frUsuario.findUnique({
            where: { USR_CODIGO: payload.sub },
        });

        if (!user) {
            throw new AuthError('INVALID_REFRESH', 401, 'Usuario nao encontrado.');
        }

        if (this.isAccountExpired(user.USR_TIPO_EXPIRACAO, user.USR_INICIO_EXPIRACAO, user.USR_DIAS_EXPIRACAO)) {
            throw new AuthError('ACCOUNT_EXPIRED', 403, 'Conta expirada.');
        }

        const newAccess = signAccessToken({
            sub: user.USR_CODIGO,
            login: user.USR_LOGIN,
            nome: user.USR_NOME,
        });

        const newRefresh = signRefreshToken({ sub: user.USR_CODIGO });

        return { accessToken: newAccess, refreshToken: newRefresh };
    }

    async getMe(usrCodigo: number): Promise<AuthUser> {
        const user = await this.prisma.frUsuario.findUnique({
            where: { USR_CODIGO: usrCodigo },
        });

        if (!user) {
            throw new AuthError('INVALID_REFRESH', 401, 'Usuario nao encontrado.');
        }

        return {
            id: user.USR_CODIGO,
            login: user.USR_LOGIN,
            nome: user.USR_NOME,
            email: user.USR_EMAIL ?? null,
            pesCod: user.PES_COD ?? null,
        };
    }

    /**
     * Conta expira quando USR_TIPO_EXPIRACAO != 'N' e a data limite passou.
     * Tipos:
     * - 'N': nunca expira
     * - 'D': dias a partir de USR_INICIO_EXPIRACAO
     * - 'F': data fixa em USR_INICIO_EXPIRACAO
     */
    private isAccountExpired(tipo: string, inicio: Date | null, dias: number | null): boolean {
        if (tipo === 'N' || !inicio) return false;

        const agora = Date.now();

        if (tipo === 'F') {
            return agora > inicio.getTime();
        }

        if (tipo === 'D' && dias && dias > 0) {
            const limite = inicio.getTime() + dias * 24 * 60 * 60 * 1000;
            return agora > limite;
        }

        return false;
    }
}
