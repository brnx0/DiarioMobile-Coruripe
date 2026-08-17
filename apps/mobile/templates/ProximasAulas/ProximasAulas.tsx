import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelection } from '../../src/context/SelectionContext';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UpcomingClass } from '@diariomobile/shared-types';
import { fetchUpcomingClasses } from '../../src/services/academic';
import { colors as colorsApp } from '../../src/constants/colors';

const colors = {
    primaryDarker: colorsApp.primaryDarker,
    textGray: '#4B5563',
    white: '#FFFFFF',
    danger: '#EF4444',
    lightBlue: '#E3F2FD',
    lightGreen: '#E8F5E9',
    lightYellow: '#FFF9C4',
    lightOrange: '#FFE0B2',
    lightPink: '#FCE4EC',
    lightPurple: '#F3E5F5',
    lightCyan: '#E0F7FA',
    lightMagenta: '#F8BBD0',
};

// Tipos para os dados de horário
interface Aula {
    disciplina: string;
    turma?: string;
    ano?: string;
    cor?: string;
    professor?: string;
    sala?: string;
    horario?: string;
    observacoes?: string;
}

interface HorarioSemanal {
    [dia: string]: {
        [periodo: string]: Aula | null;
    };
}

// Constantes completas até o 12º horário
const periodosTodos = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º', '12º'];
const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Mapeamento de número para dia da semana
const diaNumeroParaNome: { [key: number]: string } = {
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
};

// Mapeamento de número para período
const tempoNumeroParaPeriodo: { [key: number]: string } = {
    1: '1º', 2: '2º', 3: '3º', 4: '4º', 5: '5º', 6: '6º',
    7: '7º', 8: '8º', 9: '9º', 10: '10º', 11: '11º', 12: '12º',
};

const ProximasAulas: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { selectedEscola } = useSelection();
    const escolaId = selectedEscola?.id ?? 0;

    // -- STATES --
    // Estado inicial com todos os horários nulos até o 12º
    const [horarios, setHorarios] = useState<HorarioSemanal>({
        'Segunda': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        'Terça': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        'Quarta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        'Quinta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        'Sexta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        'Sábado': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [aulaSelecionada, setAulaSelecionada] = useState<{ aula: Aula; dia: string; periodo: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nomeEscola, setNomeEscola] = useState<string>('');
    const [turmasUnicas, setTurmasUnicas] = useState<Array<{ disciplina: string; turma: string; cor: string; serie: string; }>>([]);

    // Novo Estado de Filtro
    const [filtroPeriodo, setFiltroPeriodo] = useState<'manha' | 'tarde' | 'completo'>('manha');

    // -- LOGIC --

    // Filtra quais linhas (períodos) serão exibidas
    const periodosVisiveis = useMemo(() => {
        if (filtroPeriodo === 'manha') return periodosTodos.slice(0, 6); // 1º ao 6º
        if (filtroPeriodo === 'tarde') return periodosTodos.slice(6, 12); // 7º ao 12º
        return periodosTodos; // Todos
    }, [filtroPeriodo]);

    const abrirModal = (dia: string, periodo: string) => {
        const aula = horarios[dia]?.[periodo];
        if (aula) {
            setAulaSelecionada({ aula, dia, periodo });
            setModalVisible(true);
        }
    };

    const fecharModal = () => {
        setModalVisible(false);
        setAulaSelecionada(null);
    };

    const getCorPorTurma = (tmaNome: string): string => {
        let hash = 0;
        for (let i = 0; i < tmaNome.length; i++) {
            hash = tmaNome.charCodeAt(i) + ((hash << 5) - hash);
        }
        const cores = [
            colors.lightPurple, colors.lightPink, colors.lightOrange, colors.lightYellow,
            colors.lightGreen, colors.lightCyan, colors.lightMagenta, colors.lightBlue,
        ];
        return cores[Math.abs(hash) % cores.length];
    };

    const transformarDadosAPI = (dados: UpcomingClass[]) => {
        // Inicializa estrutura vazia completa (1-12)
        const horariosTransformados: HorarioSemanal = {
            'Segunda': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
            'Terça': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
            'Quarta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
            'Quinta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
            'Sexta': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
            'Sábado': { '1º': null, '2º': null, '3º': null, '4º': null, '5º': null, '6º': null, '7º': null, '8º': null, '9º': null, '10º': null, '11º': null, '12º': null },
        };

        const legendasMap = new Map<string, { disciplina: string; turma: string; cor: string; serie: string }>();

        dados.forEach((aula) => {
            const diaNome = diaNumeroParaNome[aula.day];
            const periodoNome = tempoNumeroParaPeriodo[aula.slot];

            if (diaNome && periodoNome) {
                const cor = getCorPorTurma(aula.className + aula.subjectName);
                const chaveUnica = `${aula.subjectName}-${aula.className}`;

                if (!legendasMap.has(chaveUnica)) {
                    legendasMap.set(chaveUnica, {
                        disciplina: aula.subjectName,
                        turma: aula.className,
                        serie: aula.gradeName,
                        cor,
                    });
                }

                horariosTransformados[diaNome][periodoNome] = {
                    disciplina: aula.subjectName,
                    turma: aula.className,
                    ano: aula.gradeName,
                    cor,
                    professor: aula.teacherName,
                    sala: '',
                    horario: '',
                    observacoes: `Turma: ${aula.className} | Série: ${aula.gradeName}`,
                };
            }
        });

        const legendaArray = Array.from(legendasMap.values());
        legendaArray.sort((a, b) => (a.disciplina ?? '').localeCompare(b.disciplina ?? ''));

        return { horarios: horariosTransformados, turmas: legendaArray };
    };

    useEffect(() => {
        const carregarProximasAulas = async () => {
            if (!escolaId) {
                setError('ID da escola não fornecido');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                setNomeEscola(selectedEscola?.nome ?? '');

                const dados = await fetchUpcomingClasses(escolaId);

                if (dados && dados.length > 0) {
                    const { horarios: horariosTransformados, turmas } = transformarDadosAPI(dados);
                    setHorarios(horariosTransformados);
                    setTurmasUnicas(turmas);
                } else {
                    // Mantém o estado zerado, mas carrega o objeto
                    setTurmasUnicas([]);
                }
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar próximas aulas');
            } finally {
                setIsLoading(false);
            }
        };

        carregarProximasAulas();
    }, [escolaId]);

    const renderCelulaAula = (dia: string, periodo: string) => {
        const aula = horarios[dia]?.[periodo];

        if (!aula) {
            return (
                <View className="h-16 border border-gray-200 bg-gray-50 items-center justify-center">
                    <Text className="text-xs text-gray-400">VAGO</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                className="h-16 border border-gray-200 items-center justify-center px-1"
                style={{ backgroundColor: aula.cor || colors.lightBlue }}
                onPress={() => abrirModal(dia, periodo)}
                activeOpacity={0.7}
            >
                <Text className="text-[10px] font-bold text-gray-900 text-center" numberOfLines={2}>
                    {aula.disciplina}
                </Text>
                {aula.ano && (
                    <Text className="text-[9px] text-gray-700 text-center mt-0.5" numberOfLines={1}>
                        {aula.ano}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <BackgroundPattern opacity={0.08} />

            <AppHeader title="Próximas Aulas" />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                {isLoading ? (
                    <>
                        {/* 1. SKELETON: HEADER ESCOLA & FILTRO */}
                        <View className="mx-4 mt-6 mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <View className="p-4 items-center border-b border-gray-50">
                                <View className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                                <View className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                            </View>
                            <View className="flex-row p-2 bg-gray-50 gap-2">
                                <View className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                                <View className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                                <View className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                            </View>
                        </View>

                        {/* 2. SKELETON: QUADRO BRANCO */}
                        <View className="mx-4 mb-6 bg-white rounded-lg shadow-md h-[400px] items-center justify-center border border-gray-100">
                            <ActivityIndicator size="large" color={colors.primaryDarker} />
                            <Text className="text-gray-400 mt-4 font-medium">Buscando quadro de horários...</Text>
                        </View>

                        {/* 3. SKELETON: LEGENDA */}
                        <View className="mx-4 bg-white rounded-lg shadow-md p-4 h-32 border border-gray-100">
                            <View className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                            <View className="space-y-2">
                                <View className="h-10 w-full bg-gray-50 rounded border border-gray-100" />
                                <View className="h-10 w-full bg-gray-50 rounded border border-gray-100" />
                            </View>
                        </View>
                    </>
                ) : error ? (
                    <View className="flex-1 items-center justify-center py-20 px-4">
                        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                        <Text className="text-gray-600 mt-4 text-center">{error}</Text>
                    </View>
                ) : (
                    <>
                        {/* --- CARD DA ESCOLA E FILTROS --- */}
                        <View className="mx-4 mt-6 mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Nome da Escola */}
                            <View className="p-4 items-center border-b border-gray-50">
                                <View className="bg-white flex-row items-center justify-center mb-1 w-full">
                                    <Ionicons name="school" size={20} color={colors.primaryDarker} style={{ marginRight: 8 }} />
                                    <Text className="bg-white text-sm font-bold text-gray-800 text-center flex-1" numberOfLines={4}>
                                        {nomeEscola || 'Escola'}
                                    </Text>
                                </View>
                                <Text className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
                                    Quadro de Horários
                                </Text>
                            </View>

                            {/* Filtros de Período (Segmented Control) */}
                            <View className="flex-row p-1.5 bg-gray-100/50 m-2 rounded-lg">
                                <TouchableOpacity
                                    onPress={() => setFiltroPeriodo('manha')}
                                    className="flex-1 py-2 rounded-md items-center justify-center"
                                    style={filtroPeriodo === 'manha' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 } : {}}
                                >
                                    <Text
                                        className="text-xs font-bold"
                                        style={{ color: filtroPeriodo === 'manha' ? '#0B4F93' : '#6B7280' }}
                                    >
                                        Manhã (1º-6º)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setFiltroPeriodo('tarde')}
                                    className="flex-1 py-2 rounded-md items-center justify-center"
                                    style={filtroPeriodo === 'tarde' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 } : {}}
                                >
                                    <Text
                                        className="text-xs font-bold"
                                        style={{ color: filtroPeriodo === 'tarde' ? '#0B4F93' : '#6B7280' }}
                                    >
                                        Tarde (7º-12º)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setFiltroPeriodo('completo')}
                                    className="flex-1 py-2 rounded-md items-center justify-center"
                                    style={filtroPeriodo === 'completo' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 } : {}}
                                >
                                    <Text
                                        className="text-xs font-bold"
                                        style={{ color: filtroPeriodo === 'completo' ? '#0B4F93' : '#6B7280' }}
                                    >
                                        Todos
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* --- TABELA DE HORÁRIOS --- */}
                        <View className="mx-4 mb-6 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                            {/* Cabeçalho - Dias da Semana */}
                            <View className="flex-row bg-[#0B4F93]">
                                <View className="w-12 h-10 items-center justify-center border-r border-white/20">
                                    <Ionicons name="time-outline" size={16} color="white" />
                                </View>
                                {diasSemana.map((dia) => (
                                    <View key={dia} className="flex-1 h-10 items-center justify-center border-r border-white/20 last:border-r-0">
                                        <Text className="text-white text-[10px] font-bold uppercase">{dia.substring(0, 3)}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Linhas - Períodos */}
                            {periodosVisiveis.map((periodo, index) => {
                                const isEvenRow = index % 2 === 0;
                                return (
                                    <View key={periodo} className={`flex-row border-b border-gray-100 ${isEvenRow ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        {/* Coluna de Período */}
                                        <View className="w-12 bg-[#0B4F93] h-16 items-center justify-center border-r border-r border-t border-gray-300">
                                            <Text className="text-white text-xs font-bold">{periodo}</Text>
                                        </View>

                                        {/* Células */}
                                        {diasSemana.map((dia) => (
                                            <View key={`${dia}-${periodo}`} className="flex-1 border-r border-gray-100 last:border-r-0">
                                                {renderCelulaAula(dia, periodo)}
                                            </View>
                                        ))}
                                    </View>
                                );
                            })}
                        </View>

                        {/* --- LEGENDA --- */}
                        {turmasUnicas.length > 0 && (
                            <View className="mx-4 mb-6 bg-white rounded-lg shadow-md p-4">
                                <Text className="text-sm font-semibold text-gray-700 mb-3">Legenda:</Text>
                                <View className="flex-row flex-wrap">
                                    {turmasUnicas.map((turma, index) => (
                                        <View key={index} className="flex-row items-center mr-4 mb-2">
                                            <View
                                                className="w-4 h-4 rounded-full mr-2"
                                                style={{ backgroundColor: turma.cor }}
                                            />
                                            <Text className="text-xs text-gray-700">{turma.disciplina} • {turma.serie} - {turma.turma}</Text>
                                            
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Modal de Detalhes da Aula */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={fecharModal}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-4">
                    <View className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden">
                        {/* Header do Modal */}
                        <View
                            className="flex-row items-center justify-between p-4 border-b border-gray-200"
                            style={{ backgroundColor: colors.primaryDarker }}
                        >
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-white">
                                    {aulaSelecionada?.aula.disciplina}
                                </Text>
                                {aulaSelecionada && (
                                    <Text className="text-sm text-white/90 mt-1">
                                        {aulaSelecionada.dia} - {aulaSelecionada.periodo} TEMPO
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={fecharModal} className="ml-4 p-1">
                                <Ionicons name="close-circle" size={28} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        {/* Conteúdo do Modal */}
                        <ScrollView className="max-h-96">
                            <View className="p-4 space-y-4">
                                {aulaSelecionada?.aula.ano && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="school-outline" size={20} color={colors.primaryDarker} />
                                        <Text className="ml-2 text-gray-700 font-semibold">Ano:</Text>
                                        <Text className="ml-2 text-gray-600">{aulaSelecionada.aula.ano}</Text>
                                    </View>
                                )}

                                {aulaSelecionada?.aula.turma && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="people-outline" size={20} color={colors.primaryDarker} />
                                        <Text className="ml-2 text-gray-700 font-semibold">Turma:</Text>
                                        <Text className="ml-2 text-gray-600">{aulaSelecionada.aula.turma}</Text>
                                    </View>
                                )}

                                {aulaSelecionada?.aula.professor && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="person-outline" size={20} color={colors.primaryDarker} />
                                        <Text className="ml-2 text-gray-700 font-semibold">Professor:</Text>
                                        <Text className="ml-2 text-gray-600 flex-1">{aulaSelecionada.aula.professor}</Text>
                                    </View>
                                )}

                                {aulaSelecionada?.aula.sala && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="location-outline" size={20} color={colors.primaryDarker} />
                                        <Text className="ml-2 text-gray-700 font-semibold">Sala:</Text>
                                        <Text className="ml-2 text-gray-600">{aulaSelecionada.aula.sala}</Text>
                                    </View>
                                )}

                                {aulaSelecionada?.aula.horario && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={20} color={colors.primaryDarker} />
                                        <Text className="ml-2 text-gray-700 font-semibold">Horário:</Text>
                                        <Text className="ml-2 text-gray-600">{aulaSelecionada.aula.horario}</Text>
                                    </View>
                                )}

                                {aulaSelecionada?.aula.observacoes && (
                                    <View className="mt-2">
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons name="document-text-outline" size={20} color={colors.primaryDarker} />
                                            <Text className="ml-2 text-gray-700 font-semibold">Observações:</Text>
                                        </View>
                                        <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <Text className="text-gray-600 text-sm leading-5">
                                                {aulaSelecionada.aula.observacoes}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View className="p-4 border-t border-gray-200">
                            <TouchableOpacity
                                className="py-3 px-6 rounded-lg items-center"
                                style={{ backgroundColor: colors.primaryDarker }}
                                onPress={fecharModal}
                            >
                                <Text className="text-white font-bold text-base">Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ProximasAulas;
