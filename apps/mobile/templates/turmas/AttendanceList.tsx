import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalizarNomePessoal } from '@/util/NormalizarString';
import { colors } from '../../src/constants/colors';

export interface Student {
    id: number;
    tmhCod?: string | number;
    dcfCod?: number;
    dicCod?: number;
    disCod?: number;
    pfiDeficiente?: number;
    name: string;
    presence: number[];
    justification?: string;
    tmhObservacao?: string;
}

interface AttendanceListProps {
    initialStudents: Student[];
    onAttendanceChange: (updatedStudents: Student[]) => void;
    numberOfClasses: number;
}

const TIME_COLUMN_WIDTH = 64;

const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    return parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '');
};

const AttendanceList: React.FC<AttendanceListProps> = ({ initialStudents, onAttendanceChange, numberOfClasses }) => {
    const [students, setStudents] = useState(initialStudents);
    const [isObsModalVisible, setIsObsModalVisible] = useState(false);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [justification, setJustification] = useState('');

    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);

    const classIndexes = Array.from({ length: numberOfClasses }, (_, i) => i);

    const togglePresence = (studentId: number, classIndex: number) => {
        setStudents((prev) => {
            const next = prev.map((s) => {
                if (s.id !== studentId) return s;
                const newPresence = [...s.presence];
                newPresence[classIndex] = newPresence[classIndex] === 1 ? 0 : 1;
                return { ...s, presence: newPresence };
            });
            const updated = next.find((s) => s.id === studentId);
            if (updated) onAttendanceChange([updated]);
            return next;
        });
    };

    const openObsModal = (student: Student) => {
        setActiveStudent(student);
        setJustification(student.justification ?? student.tmhObservacao ?? '');
        setIsObsModalVisible(true);
    };

    const closeObsModal = () => {
        setIsObsModalVisible(false);
        setActiveStudent(null);
        setJustification('');
    };

    const saveObsModal = () => {
        if (!activeStudent) return;
        setStudents((prev) => {
            const next = prev.map((s) =>
                s.id === activeStudent.id ? { ...s, justification } : s
            );
            const updated = next.find((s) => s.id === activeStudent.id);
            if (updated) onAttendanceChange([updated]);
            return next;
        });
        closeObsModal();
    };

    const renderHeader = () => (
        <View className="flex-row items-center px-4 pt-4 pb-2">
            <Text className="text-gray-400 text-xs font-bold tracking-wider uppercase flex-1">Aluno</Text>
            <Text className="text-gray-400 text-xs font-bold tracking-wider uppercase">Aulas →</Text>
        </View>
    );

    const renderStudent = (student: Student, index: number) => {
        const hasAbsence = student.presence.some((p) => p === 0);
        const allPresent = student.presence.every((p) => p === 1);
        const rowBg = hasAbsence ? '#FEF2F2' : allPresent ? '#ECFDF5' : '#FFFFFF';
        const presentCount = student.presence.filter((p) => p === 1).length;

        return (
            <View
                key={student.id}
                className={`p-3 ${index !== students.length - 1 ? 'border-b border-gray-100' : ''}`}
                style={{ backgroundColor: rowBg }}
            >
                {/* Topo: avatar + nome + ícone observação */}
                <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-full justify-center items-center mr-2 bg-blue-100">
                        <Text className="font-bold text-sm text-[#0B4F93]">
                            {getInitials(normalizarNomePessoal(student.name))}
                        </Text>
                    </View>

                    <View className="flex-1 pr-2">
                        <View className="flex-row items-center flex-wrap">
                            <Text className="text-gray-800 font-semibold" numberOfLines={2}>
                                {normalizarNomePessoal(student.name)}
                            </Text>
                            {student.pfiDeficiente === 1 && (
                                <MaterialCommunityIcons
                                    name="wheelchair-accessibility"
                                    size={16}
                                    color={colors.success}
                                    style={{ marginLeft: 6 }}
                                />
                            )}
                        </View>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            {presentCount}/{numberOfClasses} aula(s)
                        </Text>
                        {student.justification ? (
                            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                                Obs: {student.justification}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        onPress={() => openObsModal(student)}
                        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={student.justification ? 'note-text' : 'note-plus-outline'}
                            size={18}
                            color={colors.primaryDarker}
                        />
                    </TouchableOpacity>
                </View>

                {/* Switches por aula em scroll horizontal */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator
                    contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}
                >
                    {classIndexes.map((i) => {
                        const isPresent = student.presence[i] === 1;
                        return (
                            <View
                                key={i}
                                style={{ width: TIME_COLUMN_WIDTH, alignItems: 'center' }}
                            >
                                <Text className="text-gray-500 text-xs font-semibold mb-1">
                                    {i + 1}º
                                </Text>
                                <Switch
                                    trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
                                    thumbColor={isPresent ? colors.success : colors.error}
                                    ios_backgroundColor="#FCA5A5"
                                    value={isPresent}
                                    onValueChange={() => togglePresence(student.id, i)}
                                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                                />
                                <Text
                                    className={`text-[10px] font-bold mt-0.5 ${isPresent ? 'text-green-700' : 'text-red-700'}`}
                                >
                                    {isPresent ? 'P' : 'F'}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    return (
        <View className="mx-4">
            {renderHeader()}

            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {students.map(renderStudent)}
            </View>

            <Modal
                visible={isObsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeObsModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={80}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center' }}>
                        <View
                            style={{
                                backgroundColor: '#fff',
                                marginHorizontal: 16,
                                borderRadius: 12,
                                padding: 16,
                            }}
                        >
                            <Text className="text-lg font-bold mb-2">Observação</Text>
                            {activeStudent && (
                                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                                    {normalizarNomePessoal(activeStudent.name)}
                                </Text>
                            )}

                            <TextInput
                                value={justification}
                                onChangeText={setJustification}
                                placeholder="Digite a observação (opcional)"
                                multiline
                                numberOfLines={3}
                                className="border border-gray-200 rounded-md p-3 mb-4"
                                style={{ textAlignVertical: 'top', minHeight: 80 }}
                            />

                            <View className="flex-row justify-end">
                                <TouchableOpacity
                                    onPress={closeObsModal}
                                    className="bg-gray-500 px-4 py-2 rounded-md mr-2"
                                >
                                    <Text className="text-white">Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={saveObsModal}
                                    className="px-4 py-2 rounded-md"
                                    style={{ backgroundColor: colors.primaryDarker }}
                                >
                                    <Text className="text-white">Salvar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default AttendanceList;
