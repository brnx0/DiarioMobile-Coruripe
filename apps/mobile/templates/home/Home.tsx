import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import ProfileMenuDropdown from './ProfileMenuDropdown';
import { AppHeader } from '../../components/AppHeader';
import { BackgroundPattern } from '../../components/BackgroundPattern';
import { EscolaSwitcher } from '../../components/EscolaSwitcher';
import { ContextSwitcher } from '../../components/ContextSwitcher';
import { normalizarNomePessoal } from '../../src/util/NormalizarString';
import { colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useSelection } from '../../src/context/SelectionContext';
import { useAlert } from '../../src/context/AlertContext';
import { AppTabParamList } from '../../src/navigation/AppTabs';

interface DashboardBlock {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    targetTab: keyof AppTabParamList;
    requiresEscola?: boolean;
    requiresTurma?: boolean;
}

const dashboardBlocks: DashboardBlock[] = [
    { label: 'Diário de Classe', icon: 'book-education', targetTab: 'TurmasTab', requiresEscola: true, requiresTurma: true },
    { label: 'Planos de Aula', icon: 'book-open-outline', targetTab: 'PlanosTab', requiresEscola: true },
    { label: 'Calendário Escolar', icon: 'calendar-month-outline', targetTab: 'CalendarioTab', requiresTurma: true },
    { label: 'Próximas Aulas', icon: 'calendar-clock', targetTab: 'AulasTab', requiresEscola: true },
];

const Home: React.FC = () => {
    const navigation = useNavigation<NavigationProp<AppTabParamList>>();
    const { user, signOut } = useAuth();
    const { showToast } = useAlert();
    const {
        selectedEscola,
        errorEscolas,
        selectedTurma,
        isLoadingEscolas,
        isLoadingTurmas,
        errorTurmas,
    } = useSelection();

    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const closeMenu = () => setIsMenuVisible(false);
    const toggleMenu = () => setIsMenuVisible((v) => !v);

    const isGlobalLoading = isLoadingEscolas || isLoadingTurmas;
    const error = errorEscolas || errorTurmas;

    useEffect(() => {
        if (errorEscolas) showToast('Erro', 'error', errorEscolas);
    }, [errorEscolas, showToast]);

    useEffect(() => {
        if (errorTurmas) showToast('Erro', 'error', errorTurmas);
    }, [errorTurmas, showToast]);

    const handleBlockPress = (block: DashboardBlock) => {
        if (block.requiresEscola && !selectedEscola) {
            showToast('Atenção', 'warning', 'Selecione uma escola primeiro.');
            return;
        }
        if (block.requiresTurma && !selectedTurma) {
            showToast('Atenção', 'warning', 'Selecione uma turma primeiro.');
            return;
        }
        navigation.navigate(block.targetTab);
    };

    const userName = normalizarNomePessoal(user?.nome ?? '');
    const headerTitle = userName ? `Olá, ${userName.split(' ')[0]}` : 'Início';

    return (
        <View style={{ flex: 1 }} className="bg-white">
            <BackgroundPattern />

            {isMenuVisible && (
                <Pressable onPress={closeMenu} className="absolute inset-0 z-40" />
            )}
            <ProfileMenuDropdown
                isVisible={isMenuVisible}
                onClose={closeMenu}
                onLogout={signOut}
            />

            <AppHeader
                title={headerTitle}
                showBack={false}
                rightComponent={
                    <TouchableOpacity
                        onPress={toggleMenu}
                        className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Feather name="more-vertical" size={22} color="#FFF" />
                    </TouchableOpacity>
                }
            />

            <EscolaSwitcher />
            <ContextSwitcher />

            {error && (
                <View className="mx-4 mt-3 p-3 bg-red-100 rounded-lg border border-red-300 flex-row items-center">
                    <MaterialCommunityIcons name="alert" size={20} color={colors.error} />
                    <Text className="text-red-800 ml-2 flex-1 text-sm">{error}</Text>
                </View>
            )}

            <ScrollView className="flex-1 mt-2">
                <View className="pb-4">
                    <View className="p-2">
                        <View className={`flex-row flex-wrap ${isGlobalLoading ? 'opacity-50' : ''} justify-between`}>
                            {dashboardBlocks.map((block) => (
                                <DashboardCard
                                    key={block.label}
                                    block={block}
                                    onPress={() => handleBlockPress(block)}
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <View className="h-20" />
            </ScrollView>
        </View>
    );
};

interface DashboardCardProps {
    block: DashboardBlock;
    onPress: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ block, onPress }) => (
    <TouchableOpacity className="w-1/2 p-2" onPress={onPress}>
        <View
            className="bg-white rounded-xl h-36 p-4 items-center justify-center"
            style={{
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
            }}
        >
            <MaterialCommunityIcons name={block.icon} size={48} color={colors.primaryDarker} />
            <Text className="text-gray-700 text-center text-sm font-semibold mt-2">
                {block.label}
            </Text>
        </View>
    </TouchableOpacity>
);

export default Home;
