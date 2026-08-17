// components/JustificationModal.tsx

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JustificationModalProps {
    isVisible: boolean;
    onClose: () => void;
    currentJustification: string;
    onSave: (text: string) => void;
    studentName: string;
    aulaIndex: number;
}

const colors = { primaryBlue: '#0B4F93', danger: '#EF4444', textGray: '#4B5563' };

const JustificationModal: React.FC<JustificationModalProps> = ({ 
    isVisible, onClose, currentJustification, onSave, studentName, aulaIndex 
}) => {
    const [text, setText] = useState(currentJustification);

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white p-6 rounded-t-3xl shadow-lg">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-800">
                            Justificativa (Aula {aulaIndex + 1})
                        </Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={24} color={colors.textGray} />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-600 mb-2">Aluno: {studentName}</Text>

                    <TextInput
                        className="border border-gray-300 rounded-lg p-3 h-24 text-base mb-4"
                        placeholder="Descreva o motivo da ausência..."
                        multiline
                        value={text}
                        onChangeText={setText}
                    />

                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-[#0B4F93] py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-base">Salvar Justificativa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default JustificationModal;