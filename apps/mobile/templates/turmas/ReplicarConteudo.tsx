import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ContentHistoryItem } from '@diariomobile/shared-types';
import { fetchClasses, fetchSchools, fetchYears } from '@/services/academic';
import { fetchContentHistory, replicateContent } from '@/services/diary';
import { colors } from '../../src/constants/colors';
import SchoolPicker, { School } from 'components/ListaEscolas';
import TurmaPicker, { Turma } from 'components/TurmaPicker';
import AnoPicker from 'components/AnoPicker';
import { TurmasStackParamList } from '../../src/navigation/AppTabs';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';
import { useAlert } from '../../src/context/AlertContext';

type ReplicarConteudoRouteProp = RouteProp<TurmasStackParamList, 'ReplicarConteudo'>;
type ReplicarConteudoNavProp = NativeStackNavigationProp<TurmasStackParamList, 'ReplicarConteudo'>;

interface AnoEscolar {
    id: number | string;
    name: string;
}

const ReplicarConteudo: React.FC = () => {
    const navigation = useNavigation<ReplicarConteudoNavProp>();
    const route = useRoute<ReplicarConteudoRouteProp>();
    const { showToast } = useAlert();

    const { dicCod, conteudo, metodologia, nomeTurma, onConteudoMetodologiaSalvos } = route.params;

    const [listaAulas, setListaAulas] = useState<ContentHistoryItem[]>([]);
    const [selecionados, setSelecionados] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([]);
    const [selectedAno, setSelectedAno] = useState<AnoEscolar | null>(null);
    const [isLoadingAnos, setIsLoadingAnos] = useState(true);

    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isLoadingSchools, setIsLoadingSchools] = useState(false);

    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
    const [isLoadingTurma, setIsLoadingTurmas] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const handleAnoChange = (ano: AnoEscolar) => {
        if (ano.id === selectedAno?.id) return;

        setSelectedAno(ano);
        setSchools([]);
        setSelectedSchool(null);
        setTurmas([]);
        setSelectedTurma(null);
    };

    const handleSchoolChange = (school: School) => {
        if (school.id === selectedSchool?.id) return;

        setSelectedSchool(school);
        setTurmas([]);
        setSelectedTurma(null);
    };

    const handleTurmaChange = (turma: Turma) => {
        setSelectedTurma(turma);
    };

    const handleToggleSelecionarTodos = () => {
        if (listaAulas.length === 0) return;

        const allSelected = listaAulas.every((aula) => selecionados[aula.diaryContentId]);
        const novoMapa: Record<number, boolean> = {};
        listaAulas.forEach((aula) => {
            novoMapa[aula.diaryContentId] = !allSelected;
        });
        setSelecionados(novoMapa);
    };

    const handleConfirmarReplicacao = async () => {
        const aulasMarcadas = listaAulas.filter((aula) => selecionados[aula.diaryContentId]);

        if (aulasMarcadas.length === 0) {
            showToast('Atenção', 'info', 'Selecione ao menos uma aula para replicar.');
            return;
        }

        try {
            setIsSaving(true);
            await replicateContent(dicCod, aulasMarcadas.map((a) => a.diaryContentId));
            showToast('Sucesso!', 'success', 'Conteúdo e metodologia replicados com sucesso.');

            const conteudoReplicado = aulasMarcadas
                .map((a) => a.content)
                .filter(Boolean)
                .join(' / ');

            const metodologiaReplicada = aulasMarcadas
                .map((a) => a.methodology)
                .filter(Boolean)
                .join(' / ');

            const novoConteudoFinal = conteudo
                ? `${conteudo}\n${conteudoReplicado}`
                : conteudoReplicado;

            const novaMetodologiaFinal = metodologia
                ? `${metodologia}\n${metodologiaReplicada}`
                : metodologiaReplicada;

            if (onConteudoMetodologiaSalvos) {
                onConteudoMetodologiaSalvos(novoConteudoFinal, novaMetodologiaFinal);
            }

            navigation.goBack();
        } catch (err) {
            console.error('Erro ao replicar conteúdo/metodologia:', err);
            setError('Ocorreu um erro, tente novamente mais tarde!');
            showToast('Erro', 'error', 'Falha ao replicar o conteúdo. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSelecionado = (diaryContentId: number) => {
        setSelecionados((prev) => ({
            ...prev,
            [diaryContentId]: !prev[diaryContentId],
        }));
    };

    useEffect(() => {
        const fetchAnos = async () => {
            setIsLoadingAnos(true);
            try {
                const apiData = await fetchYears();
                const formatted: AnoEscolar[] = apiData.map((item) => ({ id: item.year, name: item.label }));
                setAnosEscolares(formatted);
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar anos escolares.');
            } finally {
                setIsLoadingAnos(false);
            }
        };
        fetchAnos();
    }, []);

    useEffect(() => {
        if (!selectedAno) return;

        let isActive = true;
        const loadSchools = async () => {
            setIsLoadingSchools(true);
            setError(null);
            try {
                const apiData = await fetchSchools(Number(selectedAno.id));
                if (!isActive) return;
                const formatted: School[] = apiData.map((escola) => ({ id: escola.id, name: escola.name }));
                setSchools(formatted);
                if (formatted.length === 1) setSelectedSchool(formatted[0]);
            } catch {
                if (isActive) setError('Erro ao buscar escolas para o ano selecionado.');
            } finally {
                if (isActive) setIsLoadingSchools(false);
            }
        };

        loadSchools();
        return () => { isActive = false; };
    }, [selectedAno]);

    useEffect(() => {
        if (!selectedSchool || !selectedAno) return;

        let isActive = true;
        const loadTurmas = async () => {
            setTurmas([]);
            setIsLoadingTurmas(true);
            setError(null);
            try {
                const apiData = await fetchClasses(Number(selectedSchool.id), Number(selectedAno.id));
                if (!isActive) return;
                const formatted: Turma[] = apiData.map((item) => ({
                    id: item.id,
                    name: `${item.subjectName} • ${item.gradeName} - ${item.className}`,
                    turma_cod: item.classId,
                }));
                setTurmas(formatted);
            } catch {
                if (isActive) setError('Erro ao buscar turmas.');
            } finally {
                if (isActive) setIsLoadingTurmas(false);
            }
        };

        loadTurmas();
        return () => { isActive = false; };
    }, [selectedSchool, selectedAno]);

    useEffect(() => {
        const carregarAulasOrigem = async () => {
            if (!selectedAno || !selectedSchool || !selectedTurma) {
                setListaAulas([]);
                return;
            }

            try {
                setIsLoading(true);
                const dados = await fetchContentHistory(Number(selectedTurma.id));
                setListaAulas(dados);
            } catch (err) {
                console.error('Erro ao carregar aulas para replicação:', err);
                showToast('Erro', 'error', 'Não foi possível carregar as aulas de origem.');
            } finally {
                setIsLoading(false);
            }
        };

        carregarAulasOrigem();
    }, [selectedAno, selectedSchool, selectedTurma, showToast]);

    return (
        <View className="flex-1 bg-gray-50 overflow-y-hidden">
            <BackgroundPattern opacity={0.08} />

            <AppHeader title="Replicar Conteúdo e Metodologia" />

            <View className="flex-1 p-6 overflow-y-hidden">
                <ScrollView className="flex-1">
                    <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-3">
                        <View className="flex-row items-center border-b border-gray-100 pb-3 mb-3">
                            <Ionicons name="options-outline" size={20} color={colors.primaryDarker} />
                            <Text className="ml-2 text-base font-bold text-gray-800">Dados de Origem</Text>
                        </View>

                        <View>
                            <AnoPicker
                                anos={anosEscolares}
                                selectedAno={selectedAno}
                                onSelect={handleAnoChange}
                                isLoading={isLoadingAnos}
                            />

                            <View className={!selectedAno ? 'opacity-50' : ''} pointerEvents={!selectedAno ? 'none' : 'auto'}>
                                <SchoolPicker
                                    schools={schools}
                                    selectedSchool={selectedSchool}
                                    onSelect={handleSchoolChange}
                                    isLoading={isLoadingSchools}
                                />
                            </View>

                            <View className={!selectedSchool ? 'opacity-50' : ''} pointerEvents={!selectedSchool ? 'none' : 'auto'}>
                                <TurmaPicker
                                    turmas={turmas}
                                    selectedTurma={selectedTurma}
                                    onSelect={handleTurmaChange}
                                    isLoading={isLoadingTurma}
                                />
                            </View>
                        </View>
                    </View>

                    <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
                        <View className="flex-row items-center border-b border-gray-100 pb-3 mb-3">
                            <Ionicons name="copy-outline" size={20} color={colors.primaryDarker} />
                            <Text className="ml-2 text-base font-bold text-gray-800">Replicar para (Destino):</Text>
                        </View>

                        <View className="gap-y-3">
                            <View className="flex-row items-center bg-gray-100 border border-gray-300 rounded-lg p-3 opacity-80">
                                <MaterialCommunityIcons name="account-group" size={20} color={colors.primaryDarker} />
                                <View className="ml-3 flex-1">
                                    <Text className="text-xs font-bold text-gray-500 uppercase mb-0.5">Turma</Text>
                                    <Text className="text-base font-medium text-gray-700" numberOfLines={3}>
                                        {nomeTurma || 'Turma não selecionada'}
                                    </Text>
                                </View>
                                <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
                            </View>
                        </View>
                    </View>

                    <View className="flex-row mb-4 space-x-3">
                        <TouchableOpacity
                            className="flex-1 py-3 px-3 rounded-lg border border-gray-300 bg-white mr-3"
                            onPress={handleToggleSelecionarTodos}
                            disabled={isSaving || isLoading || listaAulas.length === 0}
                        >
                            <Text className="text-gray-800 font-bold text-center text-sm">
                                {listaAulas.length > 0 && listaAulas.every((aula) => selecionados[aula.diaryContentId])
                                    ? 'Desmarcar todos'
                                    : 'Marcar todos'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 py-3 px-3 rounded-lg"
                            style={{ backgroundColor: colors.primaryDarker, opacity: isSaving ? 0.7 : 1 }}
                            onPress={handleConfirmarReplicacao}
                            disabled={isSaving}
                        >
                            {isSaving && (
                                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                            )}
                            <Text className="text-white font-bold text-base text-center">
                                {isSaving ? 'Replicando...' : 'Replicar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-base font-semibold text-gray-800 mb-2">
                        Selecione as aulas de origem:
                    </Text>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center py-10">
                            <ActivityIndicator size="large" color={colors.primaryDarker} />
                            <Text className="mt-4 text-gray-500 font-medium">Buscando aulas disponíveis...</Text>
                        </View>
                    ) : error ? (
                        <View className="mx-4 my-4 p-4 bg-red-50 border border-red-100 rounded-xl items-center justify-center">
                            <View className="bg-red-100 p-3 rounded-full mb-3">
                                <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#DC2626" />
                            </View>
                            <Text className="text-red-800 font-bold text-center text-lg mb-1">
                                Ops! Algo deu errado.
                            </Text>
                            <Text className="text-red-600 text-center text-sm px-4">
                                Não foi possível carregar a lista de aulas. Verifique sua conexão ou tente novamente.
                            </Text>
                        </View>
                    ) : listaAulas.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-12 mx-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <MaterialCommunityIcons name="calendar-remove" size={48} color="#9CA3AF" />
                            <Text className="mt-4 text-gray-800 font-bold text-lg">
                                Nenhuma aula encontrada
                            </Text>
                            <Text className="text-gray-500 text-center px-8 mt-1">
                                Não há registros de conteúdo/metodologia disponíveis para os filtros selecionados.
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-y-3 px-1 pb-4">
                            {listaAulas.map((aula) => {
                                const isSelected = !!selecionados[aula.diaryContentId];

                                return (
                                    <TouchableOpacity
                                        key={aula.diaryContentId}
                                        activeOpacity={0.7}
                                        onPress={() => toggleSelecionado(aula.diaryContentId)}
                                        disabled={isSaving}
                                        className={`flex-row rounded-xl border p-4 shadow-sm bg-white ${isSelected
                                            ? 'border-[#0B4F93] bg-blue-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <View className="flex-1 pr-3">
                                            <View className="flex-row items-center mb-2">
                                                <View className="bg-gray-100 px-2 py-1 rounded-md flex-row items-center mr-2">
                                                    <Ionicons name="calendar-outline" size={14} color="#4B5563" />
                                                    <Text className="ml-1 text-gray-700 font-bold text-xs">
                                                        {aula.lessonDate}
                                                    </Text>
                                                </View>
                                                <View className="bg-blue-100 px-2 py-1 rounded-md">
                                                    <Text className="text-[#0B4F93] font-bold text-[10px] uppercase">
                                                        {aula.classCount} {aula.classCount === 1 ? 'Aula' : 'Aulas'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className="mb-2">
                                                <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                                                    Conteúdo
                                                </Text>
                                                <Text className="text-gray-800 text-sm leading-5" numberOfLines={2}>
                                                    {aula.content || '—'}
                                                </Text>
                                            </View>

                                            <View>
                                                <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                                                    Metodologia
                                                </Text>
                                                <Text className="text-gray-600 text-xs leading-4" numberOfLines={2}>
                                                    {aula.methodology || '—'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="justify-center pl-2 border-l border-gray-100">
                                            <View
                                                className={`w-7 h-7 rounded-full items-center justify-center transition-all ${isSelected
                                                    ? 'bg-[#0B4F93]'
                                                    : 'bg-white border-2 border-gray-300'
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <Ionicons name="checkmark" size={18} color="white" />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default ReplicarConteudo;
