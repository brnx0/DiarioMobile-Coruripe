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
import { useSelection, type SelectedTurma } from '../src/context/SelectionContext';

interface ContextSwitcherProps {
    showShortLabel?: boolean;
}

function shortLabel(turma: SelectedTurma): string {
    return `${turma.gradeName} • ${turma.subjectName}`;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({ showShortLabel = true }) => {
    const {
        selectedTurma,
        turmas,
        recentTurmas,
        selectTurma,
        isLoadingTurmas,
    } = useSelection();

    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState('');

    const filteredAll = useMemo(() => {
        if (!query.trim()) return turmas;
        const q = query.trim().toLowerCase();
        return turmas.filter((t) => t.nome.toLowerCase().includes(q));
    }, [turmas, query]);

    const label = selectedTurma
        ? (showShortLabel ? shortLabel(selectedTurma) : selectedTurma.nome)
        : 'Selecione uma turma';

    const handleSelect = (turma: SelectedTurma) => {
        selectTurma(turma);
        setVisible(false);
        setQuery('');
    };

    return (
        <>
            <View className="px-4 pt-3 pb-2 bg-gray-50">
                <TouchableOpacity
                    onPress={() => setVisible(true)}
                    activeOpacity={0.85}
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
                        <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
                    </View>

                    <View className="flex-1 pr-2">
                        <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Turma atual
                        </Text>
                        <Text
                            className="text-sm font-bold text-gray-800"
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                    </View>

                    <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: `${colors.primary}14` }}
                    >
                        <Text className="text-xs font-bold mr-1" style={{ color: colors.primaryDarker }}>
                            Trocar
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={16} color={colors.primaryDarker} />
                    </View>
                </TouchableOpacity>
            </View>

            <SwitcherModal
                visible={visible}
                onClose={() => {
                    setVisible(false);
                    setQuery('');
                }}
                query={query}
                onQueryChange={setQuery}
                selectedTurma={selectedTurma}
                recentTurmas={recentTurmas}
                filteredAll={filteredAll}
                totalCount={turmas.length}
                isLoading={isLoadingTurmas}
                onSelect={handleSelect}
            />
        </>
    );
};

interface SwitcherModalProps {
    visible: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (v: string) => void;
    selectedTurma: SelectedTurma | null;
    recentTurmas: SelectedTurma[];
    filteredAll: SelectedTurma[];
    totalCount: number;
    isLoading: boolean;
    onSelect: (turma: SelectedTurma) => void;
}

const SwitcherModal: React.FC<SwitcherModalProps> = ({
    visible,
    onClose,
    query,
    onQueryChange,
    selectedTurma,
    recentTurmas,
    filteredAll,
    totalCount,
    isLoading,
    onSelect,
}) => {
    const insets = useSafeAreaInsets();

    const showRecents = !query.trim() && recentTurmas.length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable
                onPress={onClose}
                className="flex-1 bg-black/50 justify-end"
            >
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    className="bg-white rounded-t-3xl"
                    style={{ paddingBottom: insets.bottom + 12, maxHeight: '85%' }}
                >
                    {/* Handle */}
                    <View className="items-center pt-3">
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                        <Text className="text-lg font-bold text-gray-800">Selecionar turma</Text>
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Busca */}
                    <View className="px-5 pb-3">
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Ionicons name="search" size={18} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-800"
                                placeholder="Buscar turma..."
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

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        className="px-2"
                    >
                        {isLoading && (
                            <View className="items-center py-6">
                                <ActivityIndicator size="small" color={colors.primaryDarker} />
                                <Text className="mt-2 text-gray-500 text-sm">Carregando turmas...</Text>
                            </View>
                        )}

                        {!isLoading && totalCount === 0 && (
                            <View className="items-center py-10 px-6">
                                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                                <Text className="text-gray-700 font-bold mt-3 text-center">
                                    Nenhuma turma disponível
                                </Text>
                                <Text className="text-gray-500 text-sm text-center mt-1">
                                    Verifique se há turmas vinculadas à escola selecionada.
                                </Text>
                            </View>
                        )}

                        {showRecents && (
                            <Section title="Recentes">
                                {recentTurmas.map((turma) => (
                                    <TurmaRow
                                        key={`recent-${turma.id}`}
                                        turma={turma}
                                        isSelected={selectedTurma?.id === turma.id}
                                        onPress={() => onSelect(turma)}
                                    />
                                ))}
                            </Section>
                        )}

                        {!isLoading && totalCount > 0 && (
                            <Section title={`Todas (${totalCount})`}>
                                {filteredAll.length === 0 ? (
                                    <View className="px-3 py-4">
                                        <Text className="text-gray-500 text-sm text-center">
                                            Nenhuma turma corresponde à busca.
                                        </Text>
                                    </View>
                                ) : (
                                    filteredAll.map((turma) => (
                                        <TurmaRow
                                            key={turma.id}
                                            turma={turma}
                                            isSelected={selectedTurma?.id === turma.id}
                                            onPress={() => onSelect(turma)}
                                        />
                                    ))
                                )}
                            </Section>
                        )}

                        <View className="h-4" />
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
    <View className="mb-2">
        <Text className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
        </Text>
        {children}
    </View>
);

interface TurmaRowProps {
    turma: SelectedTurma;
    isSelected: boolean;
    onPress: () => void;
}

const TurmaRow: React.FC<TurmaRowProps> = ({ turma, isSelected, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between px-3 py-3 rounded-lg ${isSelected ? 'bg-blue-50' : ''}`}
    >
        <View className="flex-1 pr-2">
            <Text
                className={`text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-800 font-medium'}`}
                numberOfLines={2}
            >
                {turma.nome}
            </Text>
        </View>
        {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
        )}
    </TouchableOpacity>
);

export default ContextSwitcher;
