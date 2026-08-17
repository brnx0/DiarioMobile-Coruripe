import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvaliacoesTab from './AvaliacoesTab';
import SegmentedControlTabs from '../turmas/SegmentedControlTabs';
import AttendanceList, { Student } from '../turmas/AttendanceList';
import DateSelectionModal from '../../components/DateSelectionModal';
import type { AttendanceStudent, WeekdayAllocation, UpdateAttendanceStudent } from '@diariomobile/shared-types';
import { fetchWeekdays } from '@/services/academic';
import { fetchAttendance, updateAttendance } from '@/services/diary';

export type AllowedWeekdays = {
    0: boolean;
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
    5: boolean;
    6: boolean;
};

function weekdaysToAllowed(items: WeekdayAllocation[]): AllowedWeekdays {
    const allowed: AllowedWeekdays = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
    for (const item of items) {
        // API: 1=segunda...7=domingo. JS Date.getDay(): 0=domingo...6=sábado.
        const jsIndex = item.day === 7 ? 0 : item.day;
        if (jsIndex >= 0 && jsIndex <= 6) {
            allowed[jsIndex as keyof AllowedWeekdays] = item.allocated;
        }
    }
    return allowed;
}
import ConteudoMetodologia from './ConteudoMetodologia';
import { useSelection } from '../../src/context/SelectionContext';
import { useAlert } from '../../src/context/AlertContext';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';
import { ContextSwitcher } from '../../components/ContextSwitcher';

import { colors } from '../../src/constants/colors';

// turmaId é referente ao TMD_COD (Turma-Disciplina)

export const TurmaDetails: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedTurma } = useSelection();
  const { showToast } = useAlert();

  const turmaId = selectedTurma?.id ?? 0;
  const nomeTurma = selectedTurma?.nome ?? '';

  const [activeTab, setActiveTab] = useState('Frequências');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [numberOfClasses, setNumberOfClasses] = useState(0);
  const [dicCodForContent, setDicCodForContent] = useState<number | null>(null);
  const [conteudoForContent, setConteudoForContent] = useState<string>('');
  const [metodologiaForContent, setMetodologiaForContent] = useState<string>('');
  const [isSavingConteudo, setIsSavingConteudo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const disciplinaId = 0;

  const [allowedWeekdays, setAllowedWeekdays] = useState<AllowedWeekdays | null>(null);
  const [isLoadingDays, setIsLoadingDays] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const isMountedRef = useRef(true);
  const attendanceRequestIdRef = useRef(0);


  const FIXED_FOOTER_STATIC_HEIGHT = 85;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      attendanceRequestIdRef.current += 1;
    };
  }, []);

  // Reset estado dependente da turma sempre que a turma muda
  useEffect(() => {
    setAllowedWeekdays(null);
    setSelectedDate('');
    setStudents([]);
    setNumberOfClasses(0);
    setDicCodForContent(null);
    setConteudoForContent('');
    setMetodologiaForContent('');
    setError(null);
    setWarning(null);
    setActiveTab('Frequências');
    attendanceRequestIdRef.current += 1;
  }, [turmaId]);

  useEffect(() => {
    let isMounted = true;

    const fetchDiasAulas = async () => {
      if (!turmaId) {
        console.log("Turma ID não fornecido");
        return;
      }

      setIsLoadingDays(true);
      try {
        const items = await fetchWeekdays(turmaId);

        if (isMounted) {
          setAllowedWeekdays(weekdaysToAllowed(items));
        }
      } catch (error) {
        console.error("Erro ao carregar dias de aula:", error);
        setError("Não foi possível carregar os dias de aula.");
      } finally {
        if (isMounted) {
          setIsLoadingDays(false);
        }
      }
    };

    fetchDiasAulas();

    return () => {
      isMounted = false;
    };
  }, [turmaId]);

  const fetchStudentsAttendance = useCallback(async (dateString: string) => {
    const requestId = attendanceRequestIdRef.current + 1;
    attendanceRequestIdRef.current = requestId;
    const canUpdateState = () => isMountedRef.current && attendanceRequestIdRef.current === requestId;

    setError(null);
    setWarning(null);
    const dateObject = new Date(dateString + 'T00:00:00');

    if (!turmaId || !dateObject) return;

    setIsLoadingStudents(true);
    setStudents([]);
    setNumberOfClasses(0);

    try {
      const dateString = dateObject.toISOString().split('T')[0];
      const alunosData: AttendanceStudent[] = await fetchAttendance(turmaId, dateString);

      if (!canUpdateState()) return;

      const mappedStudents: Student[] = alunosData.map((aluno) => ({
        id: aluno.attendanceControlId,
        tmhCod: aluno.enrollmentId,
        dcfCod: aluno.attendanceControlId,
        dicCod: aluno.diaryContentId,
        disCod: aluno.subjectId,
        pfiDeficiente: aluno.hasDisability ? 1 : 0,
        name: aluno.studentName,
        presence: aluno.attendance,
        justification: aluno.justification ?? '',
        tmhObservacao: aluno.observation ?? '',
      }));

      setStudents(mappedStudents);

      if (alunosData.length > 0) {
        const first = alunosData[0];
        setNumberOfClasses(first.classCount);
        setDicCodForContent(first.diaryContentId ?? null);
        setConteudoForContent(first.content ?? '');
        setMetodologiaForContent(first.methodology ?? '');
      } else {
        setNumberOfClasses(0);
        setDicCodForContent(null);
        setConteudoForContent('');
        setMetodologiaForContent('');
      }

    } catch (err: any) {
      if (!canUpdateState()) return;
      const status = err?.response?.status;
      if (status === 404) {
        setWarning("A data selecionada está fora do período letivo.");
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
      setStudents([]);
      setNumberOfClasses(0);
    } finally {
      if (canUpdateState()) {
        setIsLoadingStudents(false);
      }
    }
  }, [turmaId]);

  useEffect(() => {
    if (!allowedWeekdays || selectedDate) return;

    const findLatestAllowedDate = (allowed: AllowedWeekdays): string | null => {
      const today = new Date();
      const daysToShowPast = 365 * 2;
      for (let i = 0; i <= daysToShowPast; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        if (allowed[dayOfWeek]) {
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
        }
      }
      return null;
    };

    const latest = findLatestAllowedDate(allowedWeekdays);
    if (latest) {
      setSelectedDate(latest);
      fetchStudentsAttendance(latest);
    }
  }, [allowedWeekdays, selectedDate, fetchStudentsAttendance]);

  const handleSelectDate = useCallback((dateString: string) => {
    if (dateString === selectedDate) return; 
    setSelectedDate(dateString);
    setIsModalVisible(false);
    fetchStudentsAttendance(dateString);
  }, [fetchStudentsAttendance, selectedDate]);


  const handlePreencherConteudo = () => {
    setActiveTab('Conteúdo/Metodologia');
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getDayOfWeek = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const displayDate = selectedDate ? selectedDate.split('-').reverse().join('/') : 'Selecione a data';

  const secondaryText = selectedDate
    ? getDayOfWeek(selectedDate)
    : isLoadingDays
      ? 'Carregando dias de aula...'
      : 'Clique para selecionar o dia da aula';

  const renderContent = () => {
    if (activeTab === 'Frequências') {
      if (!selectedDate) {
        return <View className="p-4"><Text className="text-gray-500 text-center">Por favor, selecione uma data para carregar a lista de frequência.</Text></View>;
      }

      if (isLoadingStudents) {
        return (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.primaryDarker} />
            <Text className="mt-4 text-gray-600">Carregando alunos...</Text>
          </View>
        );
      }

      // CORREÇÃO: Usar if (...) return ... em vez de { ... && ... }
      if (error && !isLoadingDays && !isLoadingStudents) {
        return (
          <View className="mb-4 mx-4 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center">
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <View className="ml-3 flex-1">
              <Text className="text-red-800 font-bold text-sm">Erro</Text>
              <Text className="text-red-700 text-sm mt-0.5">{error}</Text>
            </View>
          </View>
        );
      }

      // CORREÇÃO: Usar if (...) return ...
      if (warning && !isLoadingDays && !isLoadingStudents) {
        return (
          <View className="mb-4 mx-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex-row items-center">
            <Ionicons name="warning" size={24} color="#D97706" />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-800 font-bold text-sm">Atenção</Text>
              <Text className="text-yellow-700 text-sm mt-0.5">{warning}</Text>
            </View>
          </View>
        );
      }

      // CORREÇÃO: Adicionar o 'return' que faltava
      if (students.length === 0 && !isLoadingStudents) {
        return (
          <View className="p-4">
            <Text className="text-gray-500 text-center">Nenhum aluno encontrado para esta turma/disciplina na data selecionada.</Text>
          </View>
        );
      }

      return (
        <AttendanceList
          // 🚨 Removido o 'as any' desnecessário
          initialStudents={students}
          onAttendanceChange={async (modifiedStudents) => {
            try {
              const payload: UpdateAttendanceStudent[] = modifiedStudents.map((s) => ({
                attendanceControlId: s.dcfCod ?? 0,
                attendance: s.presence as (0 | 1)[],
                justification: s.justification ?? null,
              }));

              await updateAttendance(payload);
              showToast('Sucesso!', 'success', 'Frequência do aluno atualizada com sucesso.');
            } catch (err) {
              console.error('Erro ao salvar frequência:', err);
              showToast('Erro', 'error', 'Falha ao salvar a frequência. Tente novamente.');
            }
          }}
          numberOfClasses={numberOfClasses}
        />
      );
    }

    if (activeTab === 'Avaliações') {
      return <AvaliacoesTab turmaId={turmaId} />;
    }

    if (activeTab === 'Conteúdo/Metodologia') {
      return (
        <ConteudoMetodologia
          setActiveTab={setActiveTab}
          dicCod={dicCodForContent ?? 0}
          Conteudo={conteudoForContent}
          Metodologia={metodologiaForContent}
          turmaId={turmaId}
          disciplinaId={disciplinaId}
          nomeTurma={nomeTurma}
          onConteudoMetodologiaSalvos={(novoConteudo, novaMetodologia) => {
            setConteudoForContent(novoConteudo);
            setMetodologiaForContent(novaMetodologia);
          }}
          onSavingChange={setIsSavingConteudo}
        />
      );
    }
    return null;
  };


  if (!selectedTurma) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <MaterialCommunityIcons name="book-education" size={64} color={colors.gray400} />
        <Text className="text-gray-700 text-lg font-bold mt-4 text-center">
          Nenhuma turma selecionada
        </Text>
        <Text className="text-gray-500 text-sm mt-2 text-center">
          Volte para a tela inicial e selecione uma escola e uma turma nos filtros.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <BackgroundPattern opacity={0.08} />

      <DateSelectionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectDate={handleSelectDate}
        allowedWeekdays={allowedWeekdays}
        selectedDate={selectedDate}
      />

      <AppHeader title="Diário de Classe" />

      <ContextSwitcher />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: FIXED_FOOTER_STATIC_HEIGHT + insets.bottom }}
      >

        <SegmentedControlTabs
          tabs={['Frequências', 'Avaliações', 'Conteúdo/Metodologia']}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          disabledTabs={!selectedDate ? ['Conteúdo/Metodologia'] : []}
          onDisabledPress={() =>
            showToast(
              'Selecione uma data primeiro',
              'warning',
              'Para preencher Conteúdo/Metodologia, escolha uma data válida na aba Frequências.'
            )
          }
        />


        {/* --- INPUT DE DATA (Gatilho do Calendário) --- */}
        {activeTab === 'Frequências' && (
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            disabled={isLoadingDays || !allowedWeekdays}
            className="mx-4 bg-blue-50 border-l-4 border-[#0B4F93] rounded-r-lg p-4 flex-row justify-between items-center mb-6 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="bg-[#0B4F93]/10 p-2 rounded-full mr-3">
                <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primaryDarker} />
              </View>
              <View>
                <Text className="font-bold text-gray-800 text-base">
                  {isLoadingDays ? 'Carregando Dias de Aula...' : displayDate}
                </Text>
                <Text className="text-gray-600 text-xs uppercase tracking-wide">
                  {secondaryText}
                </Text>
              </View>
            </View>
            {isLoadingDays && (
              <ActivityIndicator size="small" color={colors.primaryDarker} />
            )}
            {!isLoadingDays && (
              <Ionicons name="chevron-forward" size={24} color={colors.primaryDarker} />
            )}
          </TouchableOpacity>
        )}

        {/* CONTEÚDO DINÂMICO DA ABA */}
        {renderContent()}

        <View className="h-5" />
      </ScrollView>

    </View>
  );
};

export default TurmaDetails;
