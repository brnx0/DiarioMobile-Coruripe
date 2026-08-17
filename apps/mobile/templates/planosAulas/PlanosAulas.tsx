import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyledDateInput from '../../components/StyledDateInput';
import DateSelectionModal from '../../components/DataPicker';
import DisciplinaPicker, { Disciplina } from '../../components/DisciplinaPicker';
import { fetchGrades, fetchSubjects } from '../../src/services/academic';
import { createLessonPlan, updateLessonPlan } from '../../src/services/lessonPlans';
import type { SaveLessonPlanInput } from '@diariomobile/shared-types';
import { colors } from '../../src/constants/colors';
import { LoadingSave } from '../../components/LoadingSave';
import { useSelection } from '../../src/context/SelectionContext';
import { useAlert } from '../../src/context/AlertContext';
import { PlanosStackParamList } from '../../src/navigation/AppTabs';
import { AppHeader } from '../../components/AppHeader';

type PlanosAulasRouteProp = RouteProp<PlanosStackParamList, 'PlanosAulasScreen'>;

interface AnoEscolar {
    id: number;
    name: string;
}

const converterDataParaFormatoAPI = (data: string): string => {
    if (!data) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes}-${dia}`;
    }

    try {
        const date = new Date(data);
        if (!isNaN(date.getTime())) {
            const ano = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const dia = String(date.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        }
    } catch {
        // mantem valor original
    }

    return data;
};

const PlanosAulas: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<PlanosAulasRouteProp>();
    const { selectedEscola } = useSelection();
    const { showToast } = useAlert();

    const planoAula = route.params?.planoAula;
    const escolaId = selectedEscola?.id;

    const isEditMode = !!planoAula?.id;

    const [tema, setTema] = useState(planoAula?.theme ?? '');
    const [dataInicial, setDataInicial] = useState(
        planoAula?.startDate ? converterDataParaFormatoAPI(planoAula.startDate) : ''
    );
    const [dataFinal, setDataFinal] = useState(
        planoAula?.endDate ? converterDataParaFormatoAPI(planoAula.endDate) : ''
    );
    const [anoEscolar, setAnoEscolar] = useState<AnoEscolar | null>(null);
    const [componenteCurricular, setComponenteCurricular] = useState<Disciplina | null>(null);
    const [conteudoConceitual, setConteudoConceitual] = useState(planoAula?.conceptualContent ?? '');
    const [estrategiasRecursos, setEstrategiasRecursos] = useState(planoAula?.strategy ?? '');

    const [showDatePickerInicial, setShowDatePickerInicial] = useState(false);
    const [showDatePickerFinal, setShowDatePickerFinal] = useState(false);
    const [showAnoEscolarModal, setShowAnoEscolarModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([]);
    const [isLoadingAnosEscolares, setIsLoadingAnosEscolares] = useState(false);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [isLoadingDisciplinas, setIsLoadingDisciplinas] = useState(false);

    const gradeIdPlano = useMemo(() => planoAula?.gradeId, [planoAula?.gradeId]);
    const subjectIdPlano = useMemo(() => planoAula?.subjectId, [planoAula?.subjectId]);

    const isLoadingDados = isLoadingAnosEscolares || isLoadingDisciplinas;

    useEffect(() => {
        const fetchAnos = async () => {
            if (!escolaId) {
                setAnosEscolares([]);
                return;
            }

            setIsLoadingAnosEscolares(true);
            try {
                const fetched = await fetchGrades(escolaId);
                setAnosEscolares(fetched);

                if (isEditMode && gradeIdPlano) {
                    const found = fetched.find((a) => a.id === gradeIdPlano);
                    if (found) setAnoEscolar(found);
                }
            } catch {
                showToast('Erro', 'error', 'Falha ao carregar anos escolares.');
            } finally {
                setIsLoadingAnosEscolares(false);
            }
        };

        fetchAnos();
    }, [escolaId, isEditMode, gradeIdPlano, showToast]);

    useEffect(() => {
        if (isEditMode && gradeIdPlano && anosEscolares.length > 0 && !isLoadingAnosEscolares) {
            const found = anosEscolares.find((a) => a.id === gradeIdPlano);
            if (found && (!anoEscolar || anoEscolar.id !== found.id)) {
                setAnoEscolar(found);
            }
        }
    }, [isEditMode, gradeIdPlano, anosEscolares, isLoadingAnosEscolares, anoEscolar]);

    useEffect(() => {
        const fetchDisciplinasFn = async () => {
            if (!escolaId || !anoEscolar) {
                setDisciplinas([]);
                if (!isEditMode) {
                    setComponenteCurricular(null);
                }
                return;
            }

            setIsLoadingDisciplinas(true);
            try {
                const fetched = await fetchSubjects(escolaId, { gradeId: anoEscolar.id });
                const formatted: Disciplina[] = fetched.map((item) => ({ id: item.id, name: item.name }));
                setDisciplinas(formatted);

                if (isEditMode && subjectIdPlano) {
                    const found = formatted.find((d) => Number(d.id) === Number(subjectIdPlano));
                    if (found) {
                        setComponenteCurricular(found);
                    } else if (formatted.length > 0) {
                        setComponenteCurricular(formatted[0]);
                    }
                } else if (formatted.length > 0) {
                    setComponenteCurricular(formatted[0]);
                }
            } catch {
                showToast('Erro', 'error', 'Falha ao carregar disciplinas.');
            } finally {
                setIsLoadingDisciplinas(false);
            }
        };

        fetchDisciplinasFn();
    }, [escolaId, anoEscolar, isEditMode, subjectIdPlano, showToast]);

    useEffect(() => {
        if (isEditMode && subjectIdPlano && disciplinas.length > 0 && !isLoadingDisciplinas) {
            const found = disciplinas.find((d) => Number(d.id) === Number(subjectIdPlano));
            if (found && (!componenteCurricular || componenteCurricular.id !== found.id)) {
                setComponenteCurricular(found);
            }
        }
    }, [isEditMode, subjectIdPlano, disciplinas, isLoadingDisciplinas, componenteCurricular]);

    const handleSalvar = async () => {
        if (!tema.trim()) {
            showToast('Atenção', 'warning', 'Preencha o campo Tema.');
            return;
        }
        if (!dataInicial) {
            showToast('Atenção', 'warning', 'Selecione a data inicial.');
            return;
        }
        if (!dataFinal) {
            showToast('Atenção', 'warning', 'Selecione a data final.');
            return;
        }
        if (new Date(dataInicial) > new Date(dataFinal)) {
            showToast('Atenção', 'warning', 'A data inicial deve ser anterior à data final.');
            return;
        }
        if (!anoEscolar) {
            showToast('Atenção', 'warning', 'Selecione o ano escolar.');
            return;
        }
        if (!componenteCurricular) {
            showToast('Atenção', 'warning', 'Selecione o componente curricular.');
            return;
        }
        if (!escolaId) {
            showToast('Atenção', 'warning', 'Escola não selecionada.');
            return;
        }

        const input: SaveLessonPlanInput = {
            theme: tema,
            startDate: converterDataParaFormatoAPI(dataInicial),
            endDate: converterDataParaFormatoAPI(dataFinal),
            gradeId: anoEscolar.id,
            subjectId: Number(componenteCurricular.id),
            conceptualContent: conteudoConceitual,
            strategy: estrategiasRecursos,
            schoolId: escolaId,
        };

        setIsSaving(true);
        try {
            if (isEditMode && planoAula?.id) {
                await updateLessonPlan(planoAula.id, input);
                showToast('Sucesso!', 'success', 'Plano de aula atualizado com sucesso.');
            } else {
                await createLessonPlan(input);
                showToast('Sucesso!', 'success', 'Plano de aula cadastrado com sucesso.');
            }
            navigation.goBack();
        } catch {
            showToast(
                'Erro',
                'error',
                isEditMode
                    ? 'Falha ao atualizar o plano de aula. Tente novamente.'
                    : 'Falha ao salvar o plano de aula. Tente novamente.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <AppHeader title={isEditMode ? 'Editar Plano de Aula' : 'Cadastro de Plano de Aula'} />

            {isLoadingDados && isEditMode && (
                <LoadingSave title="Carregando dados do plano de aula" subtitle="Aguarde um instante." />
            )}

            <KeyboardAwareScrollView
                className="flex-1"
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                <View className="px-4 pt-4">
                    <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">Tema</Text>
                    <TextInput
                        className="w-full border border-gray-300 rounded-lg p-3 bg-white text-base"
                        placeholder="Digite o tema do plano de aula"
                        placeholderTextColor="#999999"
                        value={tema}
                        onChangeText={setTema}
                    />
                </View>

                <StyledDateInput
                    label="Data Inicial"
                    selectedDate={dataInicial}
                    onPress={() => setShowDatePickerInicial(true)}
                />

                <StyledDateInput
                    label="Data Final"
                    selectedDate={dataFinal}
                    onPress={() => setShowDatePickerFinal(true)}
                />

                <View className="px-4 py-2 mb-2">
                    <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">Ano Escolar</Text>
                    <TouchableOpacity
                        onPress={() => setShowAnoEscolarModal(true)}
                        className="flex-row items-center justify-between bg-gray-100 border border-gray-300 rounded-lg p-3"
                        disabled={isLoadingAnosEscolares}
                    >
                        <View className="flex-row items-center flex-1">
                            <MaterialCommunityIcons name="book-education" size={20} color="#0B4F93" />
                            {isLoadingAnosEscolares ? (
                                <ActivityIndicator size="small" color={colors.primaryDarker} className="ml-2" />
                            ) : (
                                <Text className="ml-2 text-gray-800 font-medium text-base" numberOfLines={1}>
                                    {anoEscolar?.name || 'Selecione o ano escolar'}
                                </Text>
                            )}
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <DisciplinaPicker
                    disciplinas={disciplinas}
                    selectedDisciplina={componenteCurricular}
                    onSelect={setComponenteCurricular}
                    isLoading={isLoadingDisciplinas}
                />

                <View className="px-4 pt-3 pb-2">
                    <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">
                        Conteúdo Conceitual / Habilidades Propostas Curriculares
                    </Text>
                    <TextInput
                        className="min-h-[120px] border border-gray-300 rounded-lg p-3 bg-white text-base"
                        placeholder="Descreva o conteúdo conceitual e as habilidades propostas curriculares..."
                        placeholderTextColor="#999999"
                        value={conteudoConceitual}
                        onChangeText={setConteudoConceitual}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </View>

                <View className="px-4 pt-3 pb-2">
                    <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">
                        Estratégias / Recursos Didáticos
                    </Text>
                    <TextInput
                        className="min-h-[120px] border border-gray-300 rounded-lg p-3 bg-white text-base"
                        placeholder="Descreva as estratégias e recursos didáticos a serem utilizados..."
                        placeholderTextColor="#999999"
                        value={estrategiasRecursos}
                        onChangeText={setEstrategiasRecursos}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </View>

                <View className="flex-row justify-between px-4 py-6 gap-3">
                    <TouchableOpacity
                        className="flex-1 py-3 px-5 rounded-lg bg-gray-500"
                        onPress={() => navigation.goBack()}
                    >
                        <Text className="text-white font-bold text-center text-base">Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 py-3 px-5 rounded-lg"
                        style={{ backgroundColor: colors.success, opacity: isSaving ? 0.7 : 1 }}
                        onPress={handleSalvar}
                        disabled={isSaving}
                    >
                        <Text className="text-white font-bold text-center text-base">
                            {isSaving ? (isEditMode ? 'Atualizando...' : 'Salvando...') : (isEditMode ? 'Atualizar' : 'Salvar')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-20" />
            </KeyboardAwareScrollView>

            <DateSelectionModal
                isVisible={showDatePickerInicial}
                onClose={() => setShowDatePickerInicial(false)}
                onSelectDate={(date) => {
                    setDataInicial(date);
                    setShowDatePickerInicial(false);
                }}
                allowedWeekdays={null}
                selectedDate={dataInicial}
            />

            <DateSelectionModal
                isVisible={showDatePickerFinal}
                onClose={() => setShowDatePickerFinal(false)}
                onSelectDate={(date) => {
                    setDataFinal(date);
                    setShowDatePickerFinal(false);
                }}
                allowedWeekdays={null}
                selectedDate={dataFinal}
                minDate={dataInicial || undefined}
            />

            <Modal
                animationType="fade"
                transparent
                visible={showAnoEscolarModal}
                onRequestClose={() => setShowAnoEscolarModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center p-4"
                    onPress={() => setShowAnoEscolarModal(false)}
                >
                    <View
                        className="bg-white w-full max-h-[60%] rounded-xl overflow-hidden shadow-lg"
                        onStartShouldSetResponder={() => true}
                    >
                        <View className="p-4 border-b border-gray-200 bg-gray-50">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-bold text-gray-800">Selecione o Ano Escolar</Text>
                                <TouchableOpacity onPress={() => setShowAnoEscolarModal(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ScrollView>
                            {isLoadingAnosEscolares ? (
                                <View className="py-8 items-center">
                                    <ActivityIndicator size="small" color={colors.primaryDarker} />
                                    <Text className="mt-2 text-gray-600">Carregando anos escolares...</Text>
                                </View>
                            ) : anosEscolares.length === 0 ? (
                                <View className="py-8 items-center">
                                    <Text className="text-gray-500">Nenhum ano escolar disponível.</Text>
                                </View>
                            ) : (
                                anosEscolares.map((ano) => (
                                    <TouchableOpacity
                                        key={ano.id}
                                        className={`p-4 border-b border-gray-100 flex-row items-center ${anoEscolar?.id === ano.id ? 'bg-blue-50' : ''}`}
                                        onPress={() => {
                                            setAnoEscolar(ano);
                                            setComponenteCurricular(null);
                                            setShowAnoEscolarModal(false);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={anoEscolar?.id === ano.id ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={20}
                                            color={anoEscolar?.id === ano.id ? '#0B4F93' : '#9CA3AF'}
                                        />
                                        <Text className={`ml-3 text-base ${anoEscolar?.id === ano.id ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                                            {ano.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            {isSaving && (
                <LoadingSave
                    title={isEditMode ? 'Atualizando plano de aula' : 'Salvando plano de aula'}
                    subtitle={isEditMode ? 'Aguarde um instante enquanto atualizamos.' : 'Aguarde um instante enquanto salvamos.'}
                />
            )}
        </View>
    );
};

export default PlanosAulas;
