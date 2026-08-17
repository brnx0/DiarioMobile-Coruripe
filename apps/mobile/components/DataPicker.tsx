// components/DateSelectionModal.tsx

import React, { useMemo } from 'react';
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
    disabledGray: '#E5E7EB',
    textDisabled: '#D1D5DB' // Cor bem clara para indicar bloqueio
};

interface AllowedWeekdays { 0: boolean; 1: boolean; 2: boolean; 3: boolean; 4: boolean; 5: boolean; 6: boolean; }

interface DateSelectionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectDate: (dateString: string) => void;
    allowedWeekdays: AllowedWeekdays | null;
    selectedDate: string;
    minDate?: string; // Formato esperado: 'YYYY-MM-DD'
    maxDate?: string; // Formato esperado: 'YYYY-MM-DD'
}

/**
 * Converte string 'YYYY-MM-DD' para objeto Date (Meia-noite Local)
 * Resolve o problema de datas voltarem 1 dia por causa de fuso horário.
 */
const parseLocalDate = (dateString: string): Date => {
    const parts = dateString.split('-'); // [2025, 09, 02]
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês começa em 0 no JS
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
};

/**
 * Converte objeto Date para string 'YYYY-MM-DD' usando hora local.
 * IMPORTANTE: Substitui o .toISOString() que causava erros de fuso horário.
 */
const toLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const generateMarkedDates = (
    allowedWeekdays: AllowedWeekdays | null, 
    selectedDate: string,
    minDate?: string,
    maxDate?: string
): MarkedDates => {
    const marked: MarkedDates = {};
    
    // Convertemos tudo para timestamps (números) para comparação infalível
    const minTime = minDate ? parseLocalDate(minDate).getTime() : null;
    const maxTime = maxDate ? parseLocalDate(maxDate).getTime() : null;

    // Range visual do calendário
    const rangeStart = -365; 
    const rangeEnd = 365 * 2; // 2 anos para frente
    const today = new Date();

    for (let i = rangeStart; i < rangeEnd; i++) {
        // Criamos a data do loop baseada em HOJE + índice
        const dateLoop = new Date(today);
        dateLoop.setDate(today.getDate() + i);

        // Zeramos a hora para garantir comparação justa (Meia-noite)
        const dateToCheck = new Date(dateLoop.getFullYear(), dateLoop.getMonth(), dateLoop.getDate());
        const timeToCheck = dateToCheck.getTime();
        
        // Gera a chave string CORRETA (Local)
        const dateString = toLocalString(dateToCheck);
        const dayOfWeek = dateToCheck.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

        // 1. LÓGICA DE BLOQUEIO (MIN / MAX)
        let isOutOfBounds = false;
        
        if (minTime !== null && timeToCheck < minTime) {
            isOutOfBounds = true;
        }
        if (maxTime !== null && timeToCheck > maxTime) {
            isOutOfBounds = true;
        }

        // 2. LÓGICA DE SEMANA
        let isWeekdayAllowed = false;
        if (allowedWeekdays) {
            isWeekdayAllowed = allowedWeekdays[dayOfWeek];
        }

        // 3. DEFINIÇÃO DE ESTILOS
        let markStyle: any = {};

        if (isOutOfBounds) {
            // Fora do intervalo: Desabilitado total
            markStyle = { 
                disabled: true, 
                disableTouchEvent: true, 
                textColor: colors.textDisabled // Propriedade correta do react-native-calendars
            };
        } else if (allowedWeekdays && !isWeekdayAllowed) {
            // Dia da semana proibido
            markStyle = { 
                disabled: true, 
                disableTouchEvent: true, 
                textColor: colors.disabledGray
            };
        } else {
            // Dia Permitido
            markStyle = {
                disabled: false,
                marked: true,
                dotColor: colors.primaryBlue,
                customStyles: {
                    container: { backgroundColor: colors.white },
                    text: { color: colors.textGray }
                }
            };
        }

        marked[dateString] = markStyle;
    }

    // 4. APLICAR SELEÇÃO (PRIORIDADE MÁXIMA)
    // Se existe uma data selecionada e ela está dentro do range processado
    if (selectedDate && marked[selectedDate]) {
        // Se a data selecionada estiver fora do range permitido (ex: mudou filtro), não selecionamos visualmente ou mostramos erro
        // Mas assumindo que se está selecionado, é visualizado:
        
        const isSelectedDisabled = marked[selectedDate].disabled;

        marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: isSelectedDisabled ? colors.disabledGray : colors.primaryBlue,
            selectedTextColor: colors.white,
            customStyles: {
                container: {
                    backgroundColor: isSelectedDisabled ? colors.disabledGray : colors.primaryBlue,
                    borderRadius: 8,
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
    isVisible, onClose, onSelectDate, allowedWeekdays, selectedDate, minDate, maxDate
}) => {

    const markedDates = useMemo(() => {
        return generateMarkedDates(allowedWeekdays, selectedDate, minDate, maxDate);
    }, [allowedWeekdays, selectedDate, minDate, maxDate]);

    const handleDayPress = (day: { dateString: string }) => {
        const dateData = markedDates[day.dateString];
        // Bloqueia clique se estiver desabilitado (disabled: true)
        if (dateData && !dateData.disabled) {
            onSelectDate(day.dateString);
            onClose();
        }
    };

    // Define a data inicial do calendário
    // Prioridade: Data Selecionada > Data Mínima > Hoje
    const initialDate = selectedDate || minDate || toLocalString(new Date());

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
                    className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl p-2"
                    onStartShouldSetResponder={() => true}
                >
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold text-gray-800">Selecione a Data</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textGray} />
                        </TouchableOpacity>
                    </View>

                    <Calendar
                        // Limites visuais (impede swipe para meses proibidos)
                        minDate={minDate}
                        maxDate={maxDate}
                        
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        enableSwipeMonths={true}
                        markingType={'custom'}
                        current={initialDate}
                        
                        // Oculta dias de outros meses para evitar confusão visual
                        hideExtraDays={true} 
                        
                        theme={{
                            todayTextColor: colors.primaryBlue,
                            selectedDayBackgroundColor: colors.primaryBlue,
                            selectedDayTextColor: colors.white,
                            arrowColor: colors.primaryBlue,
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                            textDisabledColor: '#E5E7EB',
                        }}
                    />
                </View>
            </Pressable>
        </Modal>
    );
};

export default DateSelectionModal;