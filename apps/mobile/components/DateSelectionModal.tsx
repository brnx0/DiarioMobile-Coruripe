// components/DateSelectionModal.tsx

import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { MarkedDates } from 'react-native-calendars/src/types';

// --- CONFIGURAÇÃO DE LOCALIZAÇÃO (PORTUGUÊS) ---
LocaleConfig.locales['br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'br';

const colors = {
    primaryBlue: '#0B4F93',
    white: '#FFFFFF',
    textGray: '#4B5563',
};

// Interface que define a regra de bloqueio por dia da semana
interface AllowedWeekdays { 0: boolean; 1: boolean; 2: boolean; 3: boolean; 4: boolean; 5: boolean; 6: boolean; }

interface DateSelectionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectDate: (dateString: string) => void;
    // Regra de dias permitidos (0=Dom, 1=Seg, ..., 6=Sáb)
    allowedWeekdays: AllowedWeekdays | null;
    selectedDate: string;
}

const generateMarkedDates = (allowedWeekdays: AllowedWeekdays | null, selectedDate: string | null): MarkedDates => {
    const marked: MarkedDates = {};
    const daysToShowPast = 365 * 2;
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = -daysToShowPast; i < 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let isAllowed = false;

        // Bloqueio de data futura
        const isFutureDate = dateToCheck > todayMidnight;

        if (allowedWeekdays && !isFutureDate) {
            isAllowed = allowedWeekdays[dayOfWeek];
        }

        let markStyle: any = {};

        if (isFutureDate) {
            // 1. Regra: Bloquear todas as datas futuras
            markStyle = { disabled: true, disableTouchEvent: true, textDisabledColor: '#9CA3AF' };

        } else if (isAllowed) {
            markStyle = {
                marked: true, // Indica que o dia tem um marcador (o ponto)
                dotColor: colors.primaryBlue, // O ponto azul para identificar a aula
                textDisabledColor: colors.textGray, // Mantém a cor normal do texto para seleção
                customStyles: {
                    container: {
                        // Estilo normal para datas válidas
                        backgroundColor: colors.white,
                    },
                    text: {
                        color: colors.textGray,
                    }
                }
            };
        } else {
            // 3. Dias de folga ou bloqueados no passado/hoje
            markStyle = { disabled: true, disableTouchEvent: true, textDisabledColor: '#D1D5DB' };
        }

        marked[dateString] = markStyle;
    }

    // 🚨 SOBRESCREVER SOMENTE A DATA SELECIONADA ATUALMENTE
    if (selectedDate && marked[selectedDate]) {
        marked[selectedDate] = {
            ...marked[selectedDate], // Mantém a marcação (dot)
            selected: true, // Aplica o fundo azul apenas aqui
            selectedColor: colors.primaryBlue,
            selectedTextColor: colors.white,
            // Sobrescreve estilos customizados se existirem
            customStyles: {
                container: {
                    backgroundColor: colors.primaryBlue,
                    borderRadius: 15,
                },
                text: {
                    color: colors.white,
                    fontWeight: 'bold',
                }
            }
        };
    }

    return marked;
};


const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
    isVisible, onClose, onSelectDate, allowedWeekdays, selectedDate
}) => {

    // Se não houver uma data selecionada pelo pai, calcula a última data desbloqueada
    const findLatestAllowedDate = (allowed: AllowedWeekdays | null): string | null => {
        if (!allowed) return null;
        const today = new Date();
        const daysToShowPast = 365 * 2;
        for (let i = 0; i <= daysToShowPast; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
            const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            // não consideramos futuras, estamos iterando para trás
            if (allowed[dayOfWeek]) {
                return dateToCheck.toISOString().split('T')[0];
            }
        }
        return null;
    };

    const effectiveSelectedDate = selectedDate || findLatestAllowedDate(allowedWeekdays);
    const markedDates = generateMarkedDates(allowedWeekdays, effectiveSelectedDate ?? null);

    // Se o modal for aberto sem uma data selecionada pelo pai, alteramos o componente
    // chamando onSelectDate com a última data desbloqueada. O pai (TurmaDetails)
    // já fecha o modal e carrega os dados quando onSelectDate é chamado.
    useEffect(() => {
        if (!selectedDate && effectiveSelectedDate && isVisible) {
            onSelectDate(effectiveSelectedDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    const handleDayPress = (day: { dateString: string }) => {
        // Apenas permite seleção se o dia não estiver desativado/bloqueado
        if (!markedDates[day.dateString]?.disabled) {
            onSelectDate(day.dateString);
            onClose();
        }
    };

    // Define o mês inicial do calendário para mostrar a data selecionada ou o mês atual
    const initialMonth = (selectedDate || (allowedWeekdays ? (new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]));

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-center items-center p-4"
                onPress={onClose}
            >
                <View
                    className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
                    onStartShouldSetResponder={() => true} // Impede que o clique interno feche o modal
                >
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold text-gray-800">Selecione a Data</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textGray} />
                        </TouchableOpacity>
                    </View>

                    <Calendar
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        enableSwipeMonths={true}
                        // 🚨 Usar a data selecionada para iniciar o calendário no mês correto
                        current={initialMonth}
                        theme={{
                            todayTextColor: colors.primaryBlue,
                            selectedDayBackgroundColor: colors.primaryBlue,
                            selectedDayTextColor: colors.white,
                            arrowColor: colors.primaryBlue,
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                        }}
                    />
                </View>
            </Pressable>
        </Modal>
    );
};

export default DateSelectionModal;