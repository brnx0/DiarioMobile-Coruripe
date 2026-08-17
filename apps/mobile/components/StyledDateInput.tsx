import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DateInputProps {
    label: string;
    selectedDate: string;
    onPress: () => void;
}

const colors = { primaryBlue: '#0B4F93' };

const StyledDateInput: React.FC<DateInputProps> = ({ label, selectedDate, onPress }) => {
    const displayDate = selectedDate ? selectedDate.split('-').reverse().join('/') : 'Selecione a data';

    return (
        <View className="px-4 pt-3">
            <Text className="text-gray-600 text-xs font-bold uppercase mb-1 ml-1">
                {label}
            </Text>
            <TouchableOpacity
                onPress={onPress}
                className="flex-row items-center justify-between bg-gray-100 border border-gray-300 rounded-lg p-3"
            >
                <View className="flex-row items-center flex-1">
                    <MaterialCommunityIcons name="calendar" size={20} color={colors.primaryBlue} />
                    <Text className="ml-2 text-gray-800 font-medium text-base">
                        {displayDate}
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
            </TouchableOpacity>
        </View>
    );
};

export default StyledDateInput;