import { z } from 'zod';

export const LoginRequestSchema = z.object({
    login: z.string().trim().min(1, 'Informe o usuario.').max(20),
    senha: z.string().min(1, 'Informe a senha.'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshRequestSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token obrigatorio.'),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
