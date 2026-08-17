import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    Pressable,
    FlatList,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import type { CalendarDay, CalendarMonth, CalendarUnit } from '@diariomobile/shared-types';
import { fetchCalendar } from '../../src/services/academic';
import { colors } from '@/constants/colors';
import { useSelection } from '../../src/context/SelectionContext';
import { useAlert } from '../../src/context/AlertContext';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';
import { ContextSwitcher } from '../../components/ContextSwitcher';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface DayStyle {
    bg: string;
    text: string;
    border?: string;
}

const STATUS_STYLES: Record<CalendarDay['status'], DayStyle> = {
    LETIVO: { bg: '#ECFDF5', text: '#065F46', border: '#10B981' },
    FERIADO: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
    FIM_SEMANA: { bg: '#F3F4F6', text: '#6B7280' },
    FORA_PERIODO: { bg: '#FFFFFF', text: '#9CA3AF' },
    INICIO_UNIDADE: { bg: '#DBEAFE', text: '#1E3A8A', border: '#2563EB' },
    FIM_UNIDADE: { bg: '#EDE9FE', text: '#5B21B6', border: '#7C3AED' },
};

const STATUS_LABEL: Record<CalendarDay['status'], string> = {
    LETIVO: 'Dia letivo',
    FERIADO: 'Feriado',
    FIM_SEMANA: 'Final de semana',
    FORA_PERIODO: 'Fora do período letivo',
    INICIO_UNIDADE: 'Início de unidade',
    FIM_UNIDADE: 'Fim de unidade',
};

const CalendarioEscolar: React.FC = () => {
    const now = useMemo(() => new Date(), []);
    const { selectedTurma } = useSelection();
    const { showToast } = useAlert();

    const [year, setYear] = useState(now.getFullYear());
    const [monthIndex, setMonthIndex] = useState(now.getMonth());
    const [data, setData] = useState<CalendarMonth | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    const turmaCod = selectedTurma?.id;

    useEffect(() => {
        // Reset ao trocar turma
        setData(null);
        setError(null);
        setSelectedDay(null);
    }, [turmaCod]);

    const loadCalendar = useCallback(async () => {
        if (!turmaCod) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchCalendar(turmaCod, year, monthIndex + 1);
            setData(result);
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar o calendário.');
            showToast('Erro', 'error', 'Falha ao carregar calendário.');
        } finally {
            setIsLoading(false);
        }
    }, [turmaCod, year, monthIndex, showToast]);

    useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);

    const prevMonth = () => {
        if (monthIndex === 0) {
            setMonthIndex(11);
            setYear((y) => y - 1);
        } else {
            setMonthIndex((i) => i - 1);
        }
    };

    const nextMonth = () => {
        if (monthIndex === 11) {
            setMonthIndex(0);
            setYear((y) => y + 1);
        } else {
            setMonthIndex((i) => i + 1);
        }
    };

    const grid = useMemo(() => buildMonthGrid(year, monthIndex, data?.days ?? []), [year, monthIndex, data]);

    if (!selectedTurma) {
        return (
            <View className="flex-1 bg-gray-50">
                <BackgroundPattern opacity={0.08} />
                <AppHeader title="Calendário Escolar" />
                <ContextSwitcher />
                <View className="flex-1 items-center justify-center px-8">
                    <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={colors.gray400} />
                    <Text className="text-gray-700 text-lg font-bold mt-4 text-center">
                        Nenhuma turma selecionada
                    </Text>
                    <Text className="text-gray-500 text-sm text-center mt-2">
                        Selecione uma turma nos filtros para visualizar o calendário.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <BackgroundPattern opacity={0.08} />
            <AppHeader title="Calendário Escolar" />
            <ContextSwitcher />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Seletor de mês */}
                <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 p-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={prevMonth} className="w-10 h-10 items-center justify-center">
                            <Ionicons name="chevron-back" size={22} color={colors.primaryDarker} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setMonthPickerVisible(true)}
                            className="flex-row items-center px-3 py-2"
                            activeOpacity={0.7}
                        >
                            <Text className="text-lg font-bold text-gray-800">
                                {MONTHS[monthIndex]} {year}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.primaryDarker} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={nextMonth} className="w-10 h-10 items-center justify-center">
                            <Ionicons name="chevron-forward" size={22} color={colors.primaryDarker} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Grid */}
                <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 p-3">
                    <View className="flex-row mb-2">
                        {WEEKDAYS.map((w, i) => (
                            <View key={i} className="flex-1 items-center py-1">
                                <Text className="text-xs font-bold text-gray-500">{w}</Text>
                            </View>
                        ))}
                    </View>

                    {isLoading ? (
                        <View className="items-center py-10">
                            <ActivityIndicator size="large" color={colors.primaryDarker} />
                            <Text className="text-gray-500 mt-3 text-sm">Carregando calendário...</Text>
                        </View>
                    ) : error ? (
                        <View className="items-center py-10 px-4">
                            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.error} />
                            <Text className="text-red-700 mt-3 text-sm text-center">{error}</Text>
                            <TouchableOpacity
                                onPress={loadCalendar}
                                className="mt-3 px-4 py-2 rounded-lg"
                                style={{ backgroundColor: colors.primaryDarker }}
                            >
                                <Text className="text-white font-bold text-sm">Tentar novamente</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        grid.map((week, rowIndex) => (
                            <View key={rowIndex} className="flex-row">
                                {week.map((cell, colIndex) => (
                                    <DayCell key={colIndex} day={cell} onPress={() => cell && setSelectedDay(cell)} />
                                ))}
                            </View>
                        ))
                    )}
                </View>

                {/* Legenda */}
                <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 p-4">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Legenda</Text>
                    <View className="flex-row flex-wrap">
                        <LegendItem status="LETIVO" />
                        <LegendItem status="INICIO_UNIDADE" />
                        <LegendItem status="FIM_UNIDADE" />
                        <LegendItem status="FERIADO" />
                        <LegendItem status="FIM_SEMANA" />
                        <LegendItem status="FORA_PERIODO" />
                    </View>
                </View>

                {/* Unidades */}
                {data && data.units.length > 0 && (
                    <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 p-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Unidades letivas — {year}
                        </Text>
                        {data.units.map((u) => (
                            <UnitRow key={u.unit} unit={u} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Modal seletor de mês */}
            <Modal
                visible={monthPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <Pressable
                    onPress={() => setMonthPickerVisible(false)}
                    className="flex-1 bg-black/50 justify-center px-6"
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl overflow-hidden"
                    >
                        <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
                            <Text className="text-lg font-bold text-gray-800">Selecionar mês</Text>
                            <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={MONTHS}
                            keyExtractor={(m) => m}
                            renderItem={({ item, index }) => {
                                const isActive = index === monthIndex;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setMonthIndex(index);
                                            setMonthPickerVisible(false);
                                        }}
                                        className={`px-4 py-3 border-b border-gray-100 ${isActive ? 'bg-blue-50' : ''}`}
                                    >
                                        <Text className={`text-base ${isActive ? 'text-blue-900 font-bold' : 'text-gray-800'}`}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Modal detalhe do dia */}
            <Modal
                visible={selectedDay !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedDay(null)}
            >
                <Pressable
                    onPress={() => setSelectedDay(null)}
                    className="flex-1 bg-black/50 justify-center px-6"
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-5"
                    >
                        {selectedDay && (
                            <>
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-xs font-bold text-gray-500 uppercase">
                                            {formatDateLong(selectedDay.date)}
                                        </Text>
                                        <Text className="text-xl font-bold text-gray-800 mt-1">
                                            {STATUS_LABEL[selectedDay.status]}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedDay(null)}>
                                        <Ionicons name="close" size={22} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View
                                    className="rounded-xl p-3"
                                    style={{ backgroundColor: STATUS_STYLES[selectedDay.status].bg }}
                                >
                                    {selectedDay.reason && (
                                        <Text
                                            className="text-sm font-medium"
                                            style={{ color: STATUS_STYLES[selectedDay.status].text }}
                                        >
                                            {selectedDay.reason}
                                        </Text>
                                    )}
                                    {selectedDay.unit && (
                                        <Text className="text-xs text-gray-600 mt-1">
                                            Unidade {selectedDay.unit}
                                        </Text>
                                    )}
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

interface DayCellProps {
    day: CalendarDay | null;
    onPress: () => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, onPress }) => {
    if (!day) {
        return <View className="flex-1 aspect-square p-0.5" />;
    }
    const style = STATUS_STYLES[day.status];
    const dayNumber = parseInt(day.date.slice(8, 10), 10);
    return (
        <View className="flex-1 aspect-square p-0.5">
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                className="flex-1 rounded-md items-center justify-center border"
                style={{
                    backgroundColor: style.bg,
                    borderColor: style.border ?? 'transparent',
                }}
            >
                <Text className="text-sm font-bold" style={{ color: style.text }}>
                    {dayNumber}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const LegendItem: React.FC<{ status: CalendarDay['status'] }> = ({ status }) => {
    const style = STATUS_STYLES[status];
    return (
        <View className="flex-row items-center mr-3 mb-1">
            <View
                className="w-3 h-3 rounded-sm mr-1.5 border"
                style={{ backgroundColor: style.bg, borderColor: style.border ?? '#E5E7EB' }}
            />
            <Text className="text-xs text-gray-700">{STATUS_LABEL[status]}</Text>
        </View>
    );
};

const UnitRow: React.FC<{ unit: CalendarUnit }> = ({ unit }) => (
    <View className="flex-row items-center py-2 border-b border-gray-100 last:border-b-0">
        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Text className="text-blue-900 font-bold text-xs">{unit.unit}ª</Text>
        </View>
        <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800">
                {unit.semester ? `${unit.semester}º semestre — ` : ''}Unidade {unit.unit}
            </Text>
            <Text className="text-xs text-gray-500">
                {formatDateShort(unit.startDate)} → {formatDateShort(unit.endDate)}
            </Text>
        </View>
    </View>
);

function buildMonthGrid(year: number, monthIndex: number, days: CalendarDay[]): (CalendarDay | null)[][] {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const dayByIso = new Map(days.map((d) => [d.date, d]));
    const cells: (CalendarDay | null)[] = [];

    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
        const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push(dayByIso.get(iso) ?? null);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (CalendarDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        rows.push(cells.slice(i, i + 7));
    }
    return rows;
}

function formatDateShort(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y.slice(2)}`;
}

function formatDateLong(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

export default CalendarioEscolar;
