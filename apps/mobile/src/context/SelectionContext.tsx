import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { ClassDiscipline, School } from '@diariomobile/shared-types';
import { fetchClasses, fetchSchools } from '../services/academic';
import { normalizarNomePessoal } from '../util/NormalizarString';

const STORAGE_KEYS = {
    lastEscolaId: 'selection.lastEscolaId',
    lastTurmaId: 'selection.lastTurmaId',
    recentTurmaIds: 'selection.recentTurmaIds',
};
const MAX_RECENTS = 5;

export interface SelectedEscola {
    id: number;
    nome: string;
}

export interface SelectedTurma {
    id: number;
    nome: string;
    turmaCod: number;
    schoolId: number;
    subjectId: number;
    subjectName: string;
    gradeId: number;
    gradeName: string;
}

interface SelectionContextData {
    escolas: SelectedEscola[];
    selectedEscola: SelectedEscola | null;
    selectEscola: (escola: SelectedEscola) => void;
    isLoadingEscolas: boolean;
    errorEscolas: string | null;

    turmas: SelectedTurma[];
    selectedTurma: SelectedTurma | null;
    selectTurma: (turma: SelectedTurma | null) => void;
    isLoadingTurmas: boolean;
    errorTurmas: string | null;

    recentTurmas: SelectedTurma[];

    preCarregarEscolas: () => Promise<void>;
    refreshTurmas: () => Promise<void>;
    clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextData | undefined>(undefined);

function mapEscolas(apiSchools: School[]): SelectedEscola[] {
    return apiSchools.map((e) => ({ id: e.id, nome: e.name }));
}

function mapTurmas(apiClasses: ClassDiscipline[]): SelectedTurma[] {
    return apiClasses.map((t) => ({
        id: t.id,
        nome: `${t.subjectName} • ${t.gradeName} - ${t.className} (${normalizarNomePessoal(t.shiftName)}) • ${t.courseName}`,
        turmaCod: t.classId,
        schoolId: t.schoolId,
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        gradeId: t.gradeId,
        gradeName: t.gradeName,
    }));
}

async function loadStored<T>(key: string): Promise<T | null> {
    try {
        const raw = await SecureStore.getItemAsync(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

async function saveStored(key: string, value: unknown): Promise<void> {
    try {
        await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch {
        // ignora falha de storage
    }
}

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [escolas, setEscolas] = useState<SelectedEscola[]>([]);
    const [selectedEscola, setSelectedEscola] = useState<SelectedEscola | null>(null);
    const [isLoadingEscolas, setIsLoadingEscolas] = useState(false);
    const [errorEscolas, setErrorEscolas] = useState<string | null>(null);

    const [turmas, setTurmas] = useState<SelectedTurma[]>([]);
    const [selectedTurma, setSelectedTurma] = useState<SelectedTurma | null>(null);
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    const [errorTurmas, setErrorTurmas] = useState<string | null>(null);

    const [recentTurmaIds, setRecentTurmaIds] = useState<number[]>([]);

    // Guarda valor persistido p/ tentar restaurar quando turmas carregarem
    const storedLastTurmaIdRef = useRef<number | null>(null);
    const storedLastEscolaIdRef = useRef<number | null>(null);

    // 1) Carrega ids persistidos no mount
    useEffect(() => {
        (async () => {
            const [lastEscolaId, lastTurmaId, recents] = await Promise.all([
                loadStored<number>(STORAGE_KEYS.lastEscolaId),
                loadStored<number>(STORAGE_KEYS.lastTurmaId),
                loadStored<number[]>(STORAGE_KEYS.recentTurmaIds),
            ]);
            storedLastEscolaIdRef.current = lastEscolaId;
            storedLastTurmaIdRef.current = lastTurmaId;
            if (Array.isArray(recents)) setRecentTurmaIds(recents);
        })();
    }, []);

    const carregarTurmas = useCallback(async (escolaId: number) => {
        setIsLoadingTurmas(true);
        setErrorTurmas(null);
        setTurmas([]);
        try {
            const lista = await fetchClasses(escolaId);
            const mapped = mapTurmas(lista);
            setTurmas(mapped);

            // Restaura turma persistida se ainda existir; senão pega primeira
            const targetId = storedLastTurmaIdRef.current;
            const restored = targetId ? mapped.find((t) => t.id === targetId) : undefined;
            if (restored) {
                setSelectedTurma(restored);
            } else if (mapped.length > 0) {
                setSelectedTurma(mapped[0]);
            } else {
                setSelectedTurma(null);
            }
            storedLastTurmaIdRef.current = null;
        } catch {
            setErrorTurmas('Erro ao carregar turmas.');
        } finally {
            setIsLoadingTurmas(false);
        }
    }, []);

    const preCarregarEscolas = useCallback(async () => {
        setIsLoadingEscolas(true);
        setErrorEscolas(null);
        try {
            const lista = await fetchSchools();
            const mapped = mapEscolas(lista);
            setEscolas(mapped);

            if (mapped.length === 0) return;

            // Restaura escola persistida se ainda existir; senão primeira
            const targetId = storedLastEscolaIdRef.current;
            const restored = targetId ? mapped.find((e) => e.id === targetId) : undefined;
            const escolaInicial = restored ?? mapped[0];

            setSelectedEscola((prev) => prev ?? escolaInicial);
            if (!selectedEscola) {
                await carregarTurmas(escolaInicial.id);
            }
            storedLastEscolaIdRef.current = null;
        } catch {
            setErrorEscolas('Erro ao carregar escolas.');
        } finally {
            setIsLoadingEscolas(false);
        }
    }, [carregarTurmas, selectedEscola]);

    const refreshTurmas = useCallback(async () => {
        if (selectedEscola) {
            await carregarTurmas(selectedEscola.id);
        }
    }, [selectedEscola, carregarTurmas]);

    const selectEscola = useCallback((escola: SelectedEscola) => {
        setSelectedEscola(escola);
        saveStored(STORAGE_KEYS.lastEscolaId, escola.id);
        carregarTurmas(escola.id);
    }, [carregarTurmas]);

    const selectTurma = useCallback((turma: SelectedTurma | null) => {
        setSelectedTurma(turma);
        if (turma) {
            saveStored(STORAGE_KEYS.lastTurmaId, turma.id);
            setRecentTurmaIds((prev) => {
                const dedup = [turma.id, ...prev.filter((id) => id !== turma.id)].slice(0, MAX_RECENTS);
                saveStored(STORAGE_KEYS.recentTurmaIds, dedup);
                return dedup;
            });
        }
    }, []);

    const clearSelection = useCallback(() => {
        setEscolas([]);
        setSelectedEscola(null);
        setTurmas([]);
        setSelectedTurma(null);
        setErrorEscolas(null);
        setErrorTurmas(null);
        setRecentTurmaIds([]);
        SecureStore.deleteItemAsync(STORAGE_KEYS.lastEscolaId).catch(() => {});
        SecureStore.deleteItemAsync(STORAGE_KEYS.lastTurmaId).catch(() => {});
        SecureStore.deleteItemAsync(STORAGE_KEYS.recentTurmaIds).catch(() => {});
    }, []);

    // Deriva recentTurmas a partir de ids + turmas atuais
    const recentTurmas = recentTurmaIds
        .map((id) => turmas.find((t) => t.id === id))
        .filter((t): t is SelectedTurma => Boolean(t));

    return (
        <SelectionContext.Provider value={{
            escolas,
            selectedEscola,
            selectEscola,
            isLoadingEscolas,
            errorEscolas,
            turmas,
            selectedTurma,
            selectTurma,
            isLoadingTurmas,
            errorTurmas,
            recentTurmas,
            preCarregarEscolas,
            refreshTurmas,
            clearSelection,
        }}>
            {children}
        </SelectionContext.Provider>
    );
};

export function useSelection() {
    const ctx = useContext(SelectionContext);
    if (!ctx) {
        throw new Error('useSelection deve ser usado dentro de SelectionProvider');
    }
    return ctx;
}
