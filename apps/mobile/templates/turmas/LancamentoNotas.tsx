import React, { useEffect, useState, useCallback } from 'react';
import { Keyboard, View, Text, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LoadingSave } from 'components/LoadingSave';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
    Evaluation,
    EvaluationFieldKey,
    EvaluationStudent,
    Indicator,
} from '@diariomobile/shared-types';
import {
    fetchEvaluationStudents,
    fetchIndicators,
    fetchIndicatorStudents,
    saveEvaluationGrades,
    saveIndicatorGrades,
} from 'src/services/evaluations';
import Select from 'components/Select';
import Lookup from 'components/Lookup';

interface Props {
    isVisible: boolean;
    valorAvaliacao: number | string;
    Turma: number;
    dataAvaliacao: string;
    tipoAvaliacao: number;
    Avaliacao: Evaluation;
    unidade: number;
    onClose: () => void;
    onSuccess: () => void;
}

const FIELD_BY_AVA_ID: Record<string, EvaluationFieldKey> = {
    '1': 'AVA_AV1',
    '2': 'AVA_AV2',
    '3': 'AVA_AV3',
    '4': 'AVA_AV4',
    '5': 'AVA_AV5',
    '6': 'AVA_AV6',
    '7': 'AVA_AV7',
    '8': 'AVA_AV8',
    '9': 'AVA_AV9',
    '10': 'AVA_RECUPERACAO',
};

function fieldFromAvaId(avaId: number): EvaluationFieldKey {
    return FIELD_BY_AVA_ID[String(avaId)] ?? 'AVA_AV1';
}

const LancamentoNotas: React.FC<Props> = ({
    isVisible,
    onClose,
    onSuccess,
    valorAvaliacao,
    dataAvaliacao,
    tipoAvaliacao,
    Avaliacao,
    Turma,
    unidade,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dadosAlunos, setDadosAlunos] = useState<EvaluationStudent[]>([]);
    const [isSave, setIsSave] = useState<boolean>(false);
    const [indicadores, setIndicadores] = useState<Indicator[]>([]);
    const [selectdIndicador, setSelectedIndicador] = useState<Indicator | null>(null);

    const handleCloseModal = () => {
        setDadosAlunos([]);
        setSelectedIndicador(null);
        setIndicadores([]);
        onClose();
    };

    useEffect(() => {
        const loadIndicators = async () => {
            try {
                setIsLoading(true);
                const data = await fetchIndicators(Turma);
                setIndicadores(data);
            } catch (error) {
                console.error('Erro ao buscar Indicadores:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (tipoAvaliacao === 1 && isVisible) loadIndicators();
    }, [isVisible, tipoAvaliacao, Turma]);

    useEffect(() => {
        const loadAlunosIndicadores = async () => {
            if (!selectdIndicador) return;
            try {
                setIsLoading(true);
                const data = await fetchIndicatorStudents(selectdIndicador.id, Turma, unidade);
                setDadosAlunos(
                    data.map((s) => ({
                        id: s.id,
                        name: s.name,
                        grade: s.value,
                        average: 0,
                    })),
                );
            } catch (error) {
                Alert.alert('Erro', 'Falha ao carregar alunos para o indicador selecionado.');
                console.error('Erro ao buscar Alunos Indicadores:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (tipoAvaliacao === 1 && isVisible && selectdIndicador) loadAlunosIndicadores();
    }, [selectdIndicador, isVisible, tipoAvaliacao, Turma, unidade]);

    const tratarNota = (nota: string) => {
        let novoTexto = nota.replace(',', '.');
        if (/^\d*\.?\d*$/.test(novoTexto)) {
            if (novoTexto.includes('.')) {
                const partes = novoTexto.split('.');
                if (partes[1].length > 1) {
                    novoTexto = partes[0] + '.' + partes[1].slice(0, 1);
                }
            }
            if (novoTexto.length > 1 && novoTexto.startsWith('0') && novoTexto[1] !== '.') {
                novoTexto = novoTexto.substring(1);
            }
            return novoTexto;
        }
        return nota;
    };

    const handleChangeNotaIndicador = (index: number, textoNota: string) => {
        setDadosAlunos((prev) => {
            const novos = [...prev];
            novos[index] = { ...novos[index], grade: textoNota };
            return novos;
        });
    };

    const handleChangeNota = (index: number, textoNota: string) => {
        let novoTexto = textoNota.replace(',', '.');
        const valorNumerico = parseFloat(novoTexto);
        const maxValue = parseFloat(valorAvaliacao.toString());
        if (valorNumerico > maxValue || valorNumerico < 0) {
            Keyboard.dismiss();
            setTimeout(() => {
                Alert.alert('Atenção', `O valor máximo é: ${maxValue}`);
            }, 100);
            return;
        }
        if (/^\d*\.?\d*$/.test(novoTexto)) {
            if (novoTexto.includes('.')) {
                const partes = novoTexto.split('.');
                if (partes[1].length > 1) {
                    novoTexto = partes[0] + '.' + partes[1].slice(0, 1);
                }
            }
            if (novoTexto.length > 1 && novoTexto.startsWith('0') && novoTexto[1] !== '.') {
                novoTexto = novoTexto.substring(1);
            }
            setDadosAlunos((prev) => {
                const novos = [...prev];
                const aluno = novos[index];
                const notaAntiga = Number(aluno.grade) || 0;
                const notaNova = parseFloat(novoTexto) || 0;
                const mediaAtual = Number(aluno.average) || 0;
                const novaMedia = mediaAtual - notaAntiga + notaNova;
                novos[index] = {
                    ...aluno,
                    grade: novoTexto,
                    average: Number(novaMedia.toFixed(1)),
                };
                return novos;
            });
        }
    };

    useEffect(() => {
        const loadAlunos = async () => {
            try {
                setIsLoading(true);
                const fieldKey = fieldFromAvaId(Avaliacao.avaId);
                const data = await fetchEvaluationStudents(Avaliacao.id, fieldKey);
                setDadosAlunos(data);
            } catch (error) {
                console.error('Erro ao buscar Alunos:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (isVisible && tipoAvaliacao !== 1 && Avaliacao?.id) loadAlunos();
    }, [isVisible, Avaliacao?.id, Avaliacao?.avaId, tipoAvaliacao]);

    const handleSalvar = async () => {
        try {
            setIsSave(true);
            if (tipoAvaliacao === 1) {
                if (!selectdIndicador) return;
                await saveIndicatorGrades(selectdIndicador.id, {
                    classDisciplineId: Turma,
                    unit: unidade,
                    students: dadosAlunos.map((a) => ({
                        id: a.id,
                        name: String(a.name),
                        value: String(a.grade),
                    })),
                });
            } else {
                const fieldKey = fieldFromAvaId(Avaliacao.avaId);
                await saveEvaluationGrades(Avaliacao.id, {
                    fieldKey,
                    evaluation: { id: Avaliacao.id, value: Number(valorAvaliacao), date: dataAvaliacao },
                    students: dadosAlunos,
                });
                if (onSuccess) onSuccess();
                handleCloseModal();
            }

            Alert.alert(
                'Sucesso',
                tipoAvaliacao === 1 ? 'Indicadores lançados com sucesso!' : 'Notas lançadas com sucesso!',
            );
        } catch {
            Alert.alert('Erro', 'Falha ao salvar notas.');
        } finally {
            setIsSave(false);
        }
    };

    const optionsIndicadores = [
        { label: 'Não Trabalhada', value: 1 },
        { label: 'Ainda não realiza', value: 2 },
        { label: 'Realiza com apoio', value: 3 },
        { label: 'Realiza com autonomia', value: 4 },
    ];

    const renderAluno = useCallback(
        ({ item, index }: { item: EvaluationStudent; index: number }) => (
            <View
                className={`w-full h-ful flex-row items-center py-3 px-4 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
            >
                <View className="flex-1 pr-3">
                    <Text className="text-gray-800 font-semibold text-sm leading-tight">{String(item.name)}</Text>
                </View>
                {tipoAvaliacao !== 1 ? (
                    <>
                        <View className="w-16 items-center">
                            <View className={`px-2 py-1 rounded ${Number(item.average) >= 6 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Text
                                    className={`font-bold text-xs ${Number(item.average) >= 6 ? 'text-green-700' : 'text-red-700'}`}
                                >
                                    {Number(item.average).toFixed(1)}
                                </Text>
                            </View>
                        </View>
                        <View className="w-20 ">
                            <TextInput
                                className="w-full h-10 p-2 border border-gray-300 rounded-lg bg-white text-center text-gray-900 font-bold text-base focus:border-blue-500 focus:bg-blue-50"
                                value={tratarNota(String(item.grade || '0'))}
                                placeholder="-"
                                placeholderTextColor="#cbd5e1"
                                keyboardType="decimal-pad"
                                maxLength={4}
                                onChangeText={(text) => handleChangeNota(index, text)}
                                returnKeyType="done"
                            />
                        </View>
                    </>
                ) : (
                    <View>
                        <Select
                            options={optionsIndicadores}
                            value={item.grade}
                            onChange={(value) => handleChangeNotaIndicador(index, value.toString())}
                            placeholder="Selecione"
                        />
                    </View>
                )}
            </View>
        ),
        [dadosAlunos, tipoAvaliacao, valorAvaliacao],
    );

    return (
        <Modal animationType="fade" transparent visible={isVisible} onRequestClose={handleCloseModal}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                {isSave ? (
                    <LoadingSave title="Aguarde..." subtitle="As notas estão sendo atualizadas no sistema" />
                ) : null}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, width: '100%' }}
                >
                    <SafeAreaView className="bg-white flex-1 w-full shadow-2xl flex-col" edges={['top', 'left', 'right', 'bottom']}>
                        <View className="items-end w-full px-4 pt-2">
                            <TouchableOpacity onPress={handleCloseModal} className="p-2">
                                <MaterialCommunityIcons name="close" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {tipoAvaliacao === 1 && (
                            <View className="px-4 pb-1">
                                <Lookup<Indicator>
                                    label="Escolha um Indicador"
                                    data={indicadores}
                                    onSelect={setSelectedIndicador}
                                    filter={true}
                                    displayKey="description"
                                    uniqueKey="id"
                                    disabled={false}
                                />
                            </View>
                        )}
                        <View className="px-4 pb-4">
                            <Text className="text-xl font-bold text-gray-800">
                                {tipoAvaliacao !== 1 ? 'Avaliação: ' + Avaliacao?.description : 'Indicadores'}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                {tipoAvaliacao !== 1 ? 'Preencha as notas abaixo' : 'Preencha os indicadores abaixo'}
                            </Text>
                        </View>

                        <View className="flex-1 w-full bg-gray-50 border-t border-gray-200">
                            <View className="flex-row bg-gray-200 py-3 px-4 border-b border-gray-300">
                                {tipoAvaliacao !== 1 ? (
                                    <>
                                        <Text className="flex-1 text-xs font-bold text-gray-600 uppercase">Aluno</Text>
                                        <Text className="w-16 text-center text-xs font-bold text-gray-600 uppercase">Média</Text>
                                        <Text className="w-20 text-center text-xs font-bold text-gray-600 uppercase">Nota</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text className="flex-1 text-xs font-bold text-gray-600 uppercase">Aluno</Text>
                                        <Text className="w-40 text-center text-xs font-bold text-gray-600 uppercase">Resultado</Text>
                                    </>
                                )}
                            </View>

                            {isLoading ? (
                                <View className="flex-1 items-center justify-center">
                                    <ActivityIndicator size="large" color="#0B4F93" />
                                </View>
                            ) : (
                                <FlatList
                                    style={{ flex: 1 }}
                                    data={dadosAlunos}
                                    keyExtractor={(item) => String(item.id || Math.random())}
                                    renderItem={renderAluno}
                                    keyboardShouldPersistTaps="handled"
                                    removeClippedSubviews={false}
                                    keyboardDismissMode="interactive"
                                    showsVerticalScrollIndicator
                                    contentContainerStyle={{ paddingBottom: 100 }}
                                    initialNumToRender={10}
                                    maxToRenderPerBatch={10}
                                    windowSize={5}
                                />
                            )}
                        </View>

                        <View className="p-4 border-t border-gray-200 bg-white">
                            <TouchableOpacity
                                className={`w-full bg-blue-600 rounded-lg py-3 items-center shadow-sm active:bg-blue-700 ${isLoading || dadosAlunos.length === 0 ? 'opacity-50' : ''}`}
                                onPress={handleSalvar}
                                disabled={isLoading || dadosAlunos.length === 0}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {tipoAvaliacao !== 1 ? 'Salvar Lançamentos' : 'Salvar Indicadores'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default LancamentoNotas;
