import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalizarNomePessoal } from '@/util/NormalizarString';
import { colors } from '@/constants/colors';

export interface Turma {
    id: number | string;
    name: string;
    turma_cod: number | string;
}

interface TurmaPickerProps {
    turmas: Turma[];
    selectedTurma: Turma | null;
    onSelect: (turma: Turma) => void;
    isLoading?: boolean;
}

const TurmaPicker: React.FC<TurmaPickerProps> = ({
    turmas,
    selectedTurma,
    onSelect,
    isLoading = false
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View className="px-4 py-2 mb-2">
            <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">
                Turma
            </Text>

            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className={`flex-row items-center justify-between bg-gray-100 border border-gray-300 rounded-lg p-3 ${!turmas.length && !isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                disabled={isLoading}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                        <MaterialCommunityIcons name="account-group" size={20} color="#0B4F93" />
                        <View className="ml-2 flex-1 justify-center">
                            {isLoading ? (
                                <ActivityIndicator size="small" color={colors.primaryDarker} />
                            ) : (
                                <Text
                                    className="text-gray-800 font-medium text-base"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {!turmas.length ? 'Nenhuma turma disponível' : (selectedTurma?.name) ? normalizarNomePessoal(selectedTurma.name) : 'Selecione uma turma'}
                                </Text>
                            )}
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
                </View>
            </TouchableOpacity>

            {/* Modal de Seleção */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center p-4"
                    onPress={() => setModalVisible(false)}
                >
                    <View className="bg-white w-full max-h-[50%] rounded-xl overflow-hidden shadow-lg">
                        <View className="p-4 border-b border-gray-200 bg-gray-50">
                            <Text className="text-lg font-bold text-gray-800 text-center">
                                Selecione uma turma
                            </Text>
                        </View>

                        <FlatList
                            data={turmas}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`p-4 border-b border-gray-100 flex-row items-center ${selectedTurma?.id === item.id ? 'bg-blue-50' : ''}`}
                                    onPress={() => {
                                        onSelect(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={selectedTurma?.id === item.id ? "radiobox-marked" : "radiobox-blank"}
                                        size={20}
                                        color={selectedTurma?.id === item.id ? "#0B4F93" : "#9CA3AF"}
                                    />
                                    <Text className={`ml-3 text-base ${selectedTurma?.id === item.id ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default TurmaPicker;