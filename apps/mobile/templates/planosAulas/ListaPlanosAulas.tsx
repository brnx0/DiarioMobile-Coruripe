import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { LessonPlan } from '@diariomobile/shared-types';
import { fetchLessonPlans, deleteLessonPlan } from '../../src/services/lessonPlans';
import { colors } from '../../src/constants/colors';
import { useSelection } from '../../src/context/SelectionContext';
import { useAlert } from '../../src/context/AlertContext';
import { PlanosStackParamList } from '../../src/navigation/AppTabs';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';

type ListaPlanosNavProp = NativeStackNavigationProp<PlanosStackParamList, 'ListaPlanosAulasScreen'>;

interface FiltroDias {
    label: string;
    dias: number;
}

const FILTROS_DIAS: FiltroDias[] = [
    { label: 'Próximos 7 dias', dias: 7 },
    { label: 'Próximos 15 dias', dias: 15 },
    { label: 'Próximos 30 dias', dias: 30 },
    { label: 'Próximos 3 meses', dias: 90 },
];

const ListaPlanosAulas: React.FC = () => {
    const navigation = useNavigation<ListaPlanosNavProp>();
    const insets = useSafeAreaInsets();
    const { selectedEscola } = useSelection();
    const { showToast } = useAlert();

    const [planosAulas, setPlanosAulas] = useState<LessonPlan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroSelecionado, setFiltroSelecionado] = useState<number>(7);

    const escolaId = selectedEscola?.id;

    const carregarPlanosAulas = React.useCallback(async () => {
        if (!escolaId) return;

        setIsLoading(true);
        try {
            const dados = await fetchLessonPlans(escolaId, filtroSelecionado);
            setPlanosAulas(dados || []);
        } catch (error) {
            console.error('Erro ao carregar planos de aula:', error);
            showToast('Não foi possível carregar os planos de aula.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [escolaId, filtroSelecionado, showToast]);

    useEffect(() => {
        carregarPlanosAulas();
    }, [carregarPlanosAulas]);

    useFocusEffect(
        React.useCallback(() => {
            carregarPlanosAulas();
        }, [carregarPlanosAulas])
    );

    const handleNovoPlano = () => {
        navigation.navigate('PlanosAulasScreen', {});
    };

    const handleEditarPlano = (plano: LessonPlan) => {
        navigation.navigate('PlanosAulasScreen', { planoAula: plano });
    };

    const handleRemoverPlano = (planoId: number) => {
        setIsLoading(true);
        deleteLessonPlan(planoId)
            .then(() => {
                showToast('Plano de aula excluído com sucesso.', 'success');
                carregarPlanosAulas();
            })
            .catch((error) => {
                console.error('Erro ao excluir plano de aula:', error);
                showToast('Não foi possível excluir o plano de aula.', 'error');
            })
            .finally(() => setIsLoading(false));
    };

    if (!selectedEscola) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center px-8">
                <MaterialCommunityIcons name="book-open-outline" size={64} color={colors.gray400} />
                <Text className="text-gray-700 text-lg font-bold mt-4 text-center">
                    Nenhuma escola selecionada
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center">
                    Volte para a tela inicial e selecione uma escola nos filtros.
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <BackgroundPattern opacity={0.08} />

            <AppHeader title="Planos de Aula" />

            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-xs font-bold uppercase mb-2">Período</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {FILTROS_DIAS.map((filtro) => (
                        <TouchableOpacity
                            key={filtro.dias}
                            onPress={() => setFiltroSelecionado(filtro.dias)}
                            className={`px-4 py-2 rounded-lg mr-2 ${filtroSelecionado === filtro.dias ? 'bg-blue-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`font-semibold text-sm ${filtroSelecionado === filtro.dias ? 'text-white' : 'text-gray-700'}`}>
                                {filtro.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View className="px-4 py-3 bg-white border-b border-gray-200">
                <TouchableOpacity
                    className="flex-row items-center justify-center py-3 px-4 rounded-lg"
                    style={{ backgroundColor: colors.success }}
                    onPress={handleNovoPlano}
                >
                    <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Novo Plano de Aula</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {isLoading ? (
                    <View className="flex-row items-center justify-center py-8">
                        <ActivityIndicator size="small" color={colors.primaryDarker} />
                        <Text className="ml-2 text-gray-600">Carregando planos de aula...</Text>
                    </View>
                ) : planosAulas.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <MaterialCommunityIcons name="book-open-variant" size={64} color="#D1D5DB" />
                        <Text className="text-gray-500 text-center mt-4 text-base">
                            Nenhum plano de aula encontrado para o período selecionado.
                        </Text>
                    </View>
                ) : (
                    planosAulas.map((plano, index) => (
                        <View
                            key={plano.id || index}
                            className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
                            style={{
                                shadowColor: colors.shadowColor,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                        >
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1 mr-2">
                                    <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={2}>
                                        {plano.theme || 'Sem tema'}
                                    </Text>
                                    {plano.gradeName && <Text className="text-sm text-gray-600 mb-1">{plano.gradeName}</Text>}
                                    {plano.subjectName && <Text className="text-sm text-gray-600 mb-1">{plano.subjectName}</Text>}
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <TouchableOpacity className="p-2 rounded-full" onPress={() => handleEditarPlano(plano)}>
                                        <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color={colors.gray900} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="p-2 rounded-full ml-2"
                                        onPress={() =>
                                            Alert.alert('Excluir Plano de Aula', 'Tem certeza que deseja excluir este plano de aula?', [
                                                { text: 'Cancelar', style: 'destructive' },
                                                { text: 'Confirmar', onPress: () => handleRemoverPlano(plano.id) },
                                            ])
                                        }
                                    >
                                        <MaterialCommunityIcons name="delete-empty" size={24} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <MaterialCommunityIcons name="calendar-range" size={16} color={colors.primaryDarker} />
                                <Text className="text-xs text-gray-600 ml-1">
                                    {plano.startDate} - {plano.endDate}
                                </Text>
                            </View>

                            {plano.conceptualContent && (
                                <View className="mt-2 pt-2 border-t border-gray-100">
                                    <Text className="text-xs font-semibold text-gray-600 mb-1">Conteúdo Conceitual:</Text>
                                    <Text className="text-sm text-gray-700" numberOfLines={2}>
                                        {plano.conceptualContent}
                                    </Text>
                                </View>
                            )}

                            {plano.strategy && (
                                <View className="mt-2 pt-2 border-t border-gray-100">
                                    <Text className="text-xs font-semibold text-gray-600 mb-1">Estratégias:</Text>
                                    <Text className="text-sm text-gray-700" numberOfLines={2}>
                                        {plano.strategy}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default ListaPlanosAulas;
