import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Lookup from 'components/Lookup';
import DateSelectionModal from 'components/DataPicker';
import { LoadingSave } from 'components/LoadingSave';
import { formatDateShort } from 'src/util/FormatDate';
import type { Evaluation, EvaluationPeriod, EvaluationType } from '@diariomobile/shared-types';
import { fetchEvaluationPeriods, fetchEvaluationTypes, fetchEvaluations } from 'src/services/evaluations';
import { colors } from 'src/constants/colors';
import { useAlert } from 'src/context/AlertContext';
import LancamentoNotas from './LancamentoNotas';

interface AvaliacoesProps {
    turmaId: number;
}

const AvaliacoesTab: React.FC<AvaliacoesProps> = ({ turmaId }) => {
    const { showToast } = useAlert();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [periodoData, setPeriodoData] = useState<EvaluationPeriod[]>([]);
    const [periodo, setPeriodo] = useState<EvaluationPeriod>();
    const [typeAvaliacoesData, setTypeAvaliacoesData] = useState<EvaluationType[]>([]);
    const [avaliacoesData, setAvaliacoesData] = useState<Evaluation[]>([]);
    const [avaliacoes, setAvaliacoes] = useState<Evaluation | null>(null);
    const [avalicaoType, setAvaliacaoType] = useState<EvaluationType>();

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingAvaliacoes, setIsLoadingAvaliacoes] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [value, setValue] = useState<any>(null);
    const [allowedWeekdays] = useState({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false });
    const [minDate, setMinDate] = useState<string>('');
    const [maxDate, setMaxDate] = useState<string>('');

    // Reset estado quando turma muda
    useEffect(() => {
        setPeriodoData([]);
        setPeriodo(undefined);
        setTypeAvaliacoesData([]);
        setAvaliacaoType(undefined);
        setAvaliacoesData([]);
        setAvaliacoes(null);
        setSelectedDate('');
        setValue('');
        setMinDate('');
        setMaxDate('');
        setShowConfirmModal(false);
    }, [turmaId]);

    useEffect(() => {
        let cancelled = false;

        const fetchInitial = async () => {
            if (!turmaId) return;

            setIsLoadingInitial(true);
            try {
                const [dadosPeriodos, typeAvaliacoes] = await Promise.all([
                    fetchEvaluationPeriods(turmaId),
                    fetchEvaluationTypes(turmaId),
                ]);
                if (cancelled) return;

                setPeriodoData(dadosPeriodos);
                setTypeAvaliacoesData(typeAvaliacoes);
                if (typeAvaliacoes.length === 1) {
                    setAvaliacaoType(typeAvaliacoes[0]);
                }
                const target = new Date().setHours(0, 0, 0, 0);
                for (const p of dadosPeriodos) {
                    const min = new Date(p.minDate).setHours(0, 0, 0, 0);
                    const max = new Date(p.maxDate).setHours(0, 0, 0, 0);
                    if (target >= min && target <= max) {
                        handleSelectPeriodo(p);
                    }
                }
            } catch (error) {
                if (cancelled) return;
                console.error(error);
                showToast('Erro', 'error', 'Aconteceu um erro ao processar a requisição. Tente novamente.');
            } finally {
                if (!cancelled) setIsLoadingInitial(false);
            }
        };
        fetchInitial();

        return () => { cancelled = true; };
    }, [turmaId]);

    const clearInputs = () => {
        setAvaliacoes(null);
        setSelectedDate('');
        setValue('');
    };

    useEffect(() => {
        const loadEvaluations = async () => {
            if (periodo && (avalicaoType?.id === 3 || avalicaoType?.id === 2)) {
                try {
                    setIsLoadingAvaliacoes(true);
                    const dados = await fetchEvaluations({
                        classDisciplineId: turmaId,
                        periodId: periodo.id,
                        typeId: avalicaoType.id,
                    });
                    setAvaliacoesData(dados);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoadingAvaliacoes(false);
                }
            }
        };
        loadEvaluations();
    }, [periodo, avalicaoType, turmaId]);

    const validateValue = (numericValue: number) => {
        if (numericValue > 10 || numericValue < 0) {
            return setValue('');
        }
    };

    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
    };

    const handleSelectPeriodo = (item: EvaluationPeriod) => {
        clearInputs();
        setPeriodo(item);
        setMinDate(item.minDate);
        setMaxDate(item.maxDate);
    };

    const handleSelectAvaliacaoType = (item: EvaluationType) => {
        setAvaliacaoType(item);
    };

    const handleSelectAvaliacao = (item: Evaluation) => {
        setAvaliacoes(item);
        if (item?.date) handleSelectDate(item.date);
        setValue(item?.value ? String(item.value) : '');
    };

    const handleAvancar = () => {
        if (avalicaoType?.id === 1) {
            setShowConfirmModal(true);
            return;
        }

        if (avaliacoes && periodo && typeAvaliacoesData && selectedDate && value) {
            if (Number(avaliacoes.totalAvailable) + Number(value) > 10) {
                showToast(
                    'Atenção',
                    'warning',
                    `O valor total das avaliações não deve ser maior que 10. Disponível: ${Number(avaliacoes.totalAvailable)}`
                );
                return;
            }
            setShowConfirmModal(true);
            return;
        }

        showToast('Atenção', 'warning', 'Preencha todos os campos antes de avançar.');
    };

    const isOnlyDiretas = avalicaoType?.id === 1;

    return (
        <View className="px-4 flex-1">
            <KeyboardAwareScrollView className="flex-1" enableOnAndroid keyboardShouldPersistTaps="handled">
                <Lookup<EvaluationPeriod>
                    placeholder="Toque para Selecionar"
                    data={periodoData}
                    displayKey="description"
                    uniqueKey="id"
                    onSelect={handleSelectPeriodo}
                    isLoading={isLoadingInitial}
                    selectedItem={periodo}
                    filter
                    label="Período"
                />

                <Lookup<EvaluationType>
                    data={typeAvaliacoesData}
                    placeholder="Toque para Selecionar"
                    displayKey="description"
                    uniqueKey="id"
                    onSelect={handleSelectAvaliacaoType}
                    filter={false}
                    label="Tipo de Avaliação"
                    isLoading={isLoadingInitial}
                    selectedItem={avalicaoType}
                    disabled={typeAvaliacoesData.length === 1}
                />

                {!isOnlyDiretas && (
                    <Lookup<Evaluation>
                        data={avaliacoesData}
                        placeholder={periodo && avalicaoType ? 'Avaliações Cadastradas' : 'Informe o Período e Tipo de Avaliação Antes'}
                        displayKey="description"
                        uniqueKey="id"
                        onSelect={handleSelectAvaliacao}
                        filter={false}
                        label="Selecione a Avaliação"
                        isLoading={isLoadingAvaliacoes}
                        selectedItem={avaliacoes}
                        disabled={!periodo || !avalicaoType}
                    />
                )}

                <DateSelectionModal
                    isVisible={isModalVisible}
                    minDate={minDate}
                    maxDate={maxDate}
                    onClose={() => setIsModalVisible(false)}
                    onSelectDate={handleSelectDate}
                    allowedWeekdays={allowedWeekdays}
                    selectedDate={selectedDate}
                />

                {!isOnlyDiretas && (
                    <>
                        <TouchableOpacity
                            onPress={() =>
                                periodo && avaliacoes
                                    ? setIsModalVisible(true)
                                    : showToast('Atenção', 'warning', 'Informe o Período primeiro')
                            }
                            disabled={!periodo || !avaliacoes}
                            className="mt-4 bg-blue-50 border-l-4 border-[#0B4F93] rounded-r-lg p-4 flex-row justify-between items-center shadow-sm"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-[#0B4F93]/10 p-2 rounded-full mr-3">
                                    <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primary} />
                                </View>
                                <View>
                                    <Text className="font-bold text-gray-800 text-base">Data da Avaliação</Text>
                                    <Text className="text-gray-600 text-xs uppercase tracking-wide">
                                        {selectedDate
                                            ? formatDateShort(selectedDate)
                                            : periodo
                                                ? 'Toque para selecionar a data'
                                                : 'Informe o Período e à Avaliação'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View className="mt-4">
                            <Text className="text-gray-700 font-bold mb-2 text-sm">Valor da Avaliação</Text>
                            <TextInput
                                className="text-left justify-start bg-white border border-gray-300 text-gray-800 rounded-lg p-3 shadow-sm"
                                textAlignVertical="center"
                                placeholder="Informe o Valor da Avaliação. Ex: 8.5"
                                placeholderTextColor="#9CA3AF"
                                value={value ? String(value) : ''}
                                keyboardType="decimal-pad"
                                maxLength={4}
                                onChangeText={(text) => setValue(text.replace(',', '.'))}
                                onBlur={() => validateValue(Number(value))}
                                returnKeyType="default"
                            />
                        </View>
                    </>
                )}

                <View className="flex-1 w-full mt-6 mb-6 items-center">
                    <TouchableOpacity
                        className="w-64 rounded-lg p-4 items-center shadow-sm"
                        style={{ backgroundColor: colors.primaryDarker }}
                        onPress={handleAvancar}
                    >
                        <Text className="text-white font-bold text-base">Avançar</Text>
                    </TouchableOpacity>
                </View>

                {periodo && avalicaoType && (
                    <LancamentoNotas
                        isVisible={showConfirmModal}
                        onClose={() => setShowConfirmModal(false)}
                        onSuccess={() => { }}
                        valorAvaliacao={value}
                        unidade={periodo.id}
                        dataAvaliacao={selectedDate}
                        tipoAvaliacao={Number(avalicaoType?.id)}
                        Avaliacao={avaliacoes!}
                        Turma={turmaId}
                    />
                )}
            </KeyboardAwareScrollView>

            {isLoadingInitial && (
                <LoadingSave title="Estamos carregando as informações" subtitle="" />
            )}
        </View>
    );
};

export default AvaliacoesTab;
