import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@diariomobile/shared-types';
import { loginRequest, refreshRequest } from '../services/Auth';
import {
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    registerApiInterceptors,
} from '../services/apiClient';
import { useAlert } from './AlertContext';

const USER_KEY = 'authUser';

interface AuthContextData {
    user: AuthUser | null;
    loading: boolean;
    signIn: (login: string, senha: string) => Promise<{ ok: boolean; errorMessage?: string }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

async function loadStoredUser(): Promise<AuthUser | null> {
    try {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useAlert();

    const userRef = useRef<AuthUser | null>(null);
    userRef.current = user;

    useEffect(() => {
        (async () => {
            const stored = await loadStoredUser();
            setUser(stored);
            setLoading(false);
        })();
    }, []);

    const signIn = useCallback(async (login: string, senha: string) => {
        const result = await loginRequest(login, senha);
        if (!result.ok || !result.data) {
            return { ok: false, errorMessage: result.errorMessage };
        }

        const { accessToken, refreshToken, user: authUser } = result.data;
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
            SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser)),
        ]);

        setUser(authUser);
        return { ok: true };
    }, []);

    const signOut = useCallback(async () => {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_KEY),
        ]);
        setUser(null);
    }, []);

    const tryRefresh = useCallback(async (): Promise<string | null> => {
        const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!stored) return null;

        const result = await refreshRequest(stored);
        if (!result) return null;

        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken),
        ]);
        return result.accessToken;
    }, []);

    useEffect(() => {
        registerApiInterceptors({
            signOut,
            showToast,
            refresh: tryRefresh,
        });
    }, [signOut, showToast, tryRefresh]);

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return ctx;
}
