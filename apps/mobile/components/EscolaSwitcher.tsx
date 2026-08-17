import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { useSelection, type SelectedEscola } from '../src/context/SelectionContext';

export const EscolaSwitcher: React.FC = () => {
    const {
        escolas,
        selectedEscola,
        selectEscola,
        isLoadingEscolas,
    } = useSelection();

    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!query.trim()) return escolas;
        const q = query.trim().toLowerCase();
        return escolas.filter((e) => e.nome.toLowerCase().includes(q));
    }, [escolas, query]);

    const handleSelect = (escola: SelectedEscola) => {
        selectEscola(escola);
        setVisible(false);
        setQuery('');
    };

    const label = selectedEscola ? selectedEscola.nome : 'Selecione uma escola';
    const isSingle = escolas.length === 1;

    return (
        <>
            <View className="px-4 pt-3 pb-1 bg-gray-50">
                <TouchableOpacity
                    onPress={() => !isSingle && setVisible(true)}
                    activeOpacity={isSingle ? 1 : 0.85}
                    disabled={isSingle || isLoadingEscolas}
                    className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200"
                    style={{
                        shadowColor: colors.shadowColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}1A` }}
                    >
                        <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
                    </View>

                    <View className="flex-1 pr-2">
                        <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Escola atual
                        </Text>
                        <Text className="text-sm font-bold text-gray-800" numberOfLines={2}>
                            {isLoadingEscolas ? 'Carregando...' : label}
                        </Text>
                    </View>

                    {!isSingle && (
                        <View
                            className="flex-row items-center px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: `${colors.primary}14` }}
                        >
                            <Text className="text-xs font-bold mr-1" style={{ color: colors.primaryDarker }}>
                                Trocar
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.primaryDarker} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <EscolaModal
                visible={visible}
                onClose={() => {
                    setVisible(false);
                    setQuery('');
                }}
                query={query}
                onQueryChange={setQuery}
                selectedEscola={selectedEscola}
                filtered={filtered}
                totalCount={escolas.length}
                isLoading={isLoadingEscolas}
                onSelect={handleSelect}
            />
        </>
    );
};

interface EscolaModalProps {
    visible: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (v: string) => void;
    selectedEscola: SelectedEscola | null;
    filtered: SelectedEscola[];
    totalCount: number;
    isLoading: boolean;
    onSelect: (escola: SelectedEscola) => void;
}

const EscolaModal: React.FC<EscolaModalProps> = ({
    visible,
    onClose,
    query,
    onQueryChange,
    selectedEscola,
    filtered,
    totalCount,
    isLoading,
    onSelect,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable onPress={onClose} className="flex-1 bg-black/50 justify-end">
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    className="bg-white rounded-t-3xl"
                    style={{ paddingBottom: insets.bottom + 12, maxHeight: '85%' }}
                >
                    <View className="items-center pt-3">
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </View>

                    <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                        <Text className="text-lg font-bold text-gray-800">Selecionar escola</Text>
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-5 pb-3">
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Ionicons name="search" size={18} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Buscar escola..."
                                placeholderTextColor="#9CA3AF"
                                value={query}
                                onChangeText={onQueryChange}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {query.length > 0 && (
                                <TouchableOpacity onPress={() => onQueryChange('')}>
                                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <ScrollView keyboardShouldPersistTaps="handled" className="px-2">
                        {isLoading && (
                            <View className="items-center py-6">
                                <ActivityIndicator size="small" color={colors.primaryDarker} />
                                <Text className="mt-2 text-gray-500 text-sm">Carregando escolas...</Text>
                            </View>
                        )}

                        {!isLoading && totalCount === 0 && (
                            <View className="items-center py-10 px-6">
                                <MaterialCommunityIcons name="school-outline" size={48} color="#D1D5DB" />
                                <Text className="text-gray-700 font-bold mt-3 text-center">
                                    Nenhuma escola disponível
                                </Text>
                            </View>
                        )}

                        {!isLoading && totalCount > 0 && (
                            <View className="mb-2">
                                <Text className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Todas ({totalCount})
                                </Text>
                                {filtered.length === 0 ? (
                                    <View className="px-3 py-4">
                                        <Text className="text-gray-500 text-sm text-center">
                                            Nenhuma escola corresponde à busca.
                                        </Text>
                                    </View>
                                ) : (
                                    filtered.map((escola) => {
                                        const isSelected = selectedEscola?.id === escola.id;
                                        return (
                                            <TouchableOpacity
                                                key={escola.id}
                                                onPress={() => onSelect(escola)}
                                                activeOpacity={0.7}
                                                className={`flex-row items-center justify-between px-3 py-3 rounded-lg ${isSelected ? 'bg-blue-50' : ''}`}
                                            >
                                                <View className="flex-1 pr-2">
                                                    <Text
                                                        className={`text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-800 font-medium'}`}
                                                        numberOfLines={2}
                                                    >
                                                        {escola.nome}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        <View className="h-4" />
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default EscolaSwitcher;
