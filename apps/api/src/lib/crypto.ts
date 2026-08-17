import { createHash } from 'node:crypto';

/**
 * Gera o hash de senha no formato legado: MD5(USR_CODIGO || senha_plain).
 * Mantem compatibilidade com portal de educacao existente.
 */
export function hashLegacyPassword(usrCodigo: number, senhaPlain: string): string {
    return createHash('md5')
        .update(`${usrCodigo}${senhaPlain}`, 'utf8')
        .digest('hex');
}

/**
 * Verifica se senha plain confere com hash armazenado.
 * Comparacao constant-time evita timing attacks.
 */
export function verifyLegacyPassword(usrCodigo: number, senhaPlain: string, hashStored: string): boolean {
    const computed = hashLegacyPassword(usrCodigo, senhaPlain);
    if (computed.length !== hashStored.length) return false;

    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
        diff |= computed.charCodeAt(i) ^ hashStored.charCodeAt(i);
    }
    return diff === 0;
}
