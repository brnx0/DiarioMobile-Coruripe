import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import type { JwtAccessPayload, JwtRefreshPayload } from '@diariomobile/shared-types';

const JwtRefreshPayloadSchema = z.object({
    sub: z.number(),
    iat: z.number().optional(),
    exp: z.number().optional(),
});

export function signAccessToken(payload: JwtAccessPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown;
    return JwtRefreshPayloadSchema.parse(payload);
}
