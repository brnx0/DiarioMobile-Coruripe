import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import Login from '../../templates/login/Login';
import { AppTabs } from '../navigation/AppTabs';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useSelection } from '../context/SelectionContext';
import { colors } from '../constants/colors';

export type RootStackParamList = {
    Login: undefined;
    AppTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainNavigator() {
    const { user, loading } = useAuth();
    const { preCarregarEscolas } = useSelection();
    const [dadosProntos, setDadosProntos] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Iniciando...');

    useEffect(() => {
        if (loading) return;

        if (!user) {
            setDadosProntos(false);
            return;
        }

        async function init() {
            setStatusMessage('Sincronizando informações...');
            try {
                await preCarregarEscolas();
            } catch {
                // erros já são reportados via toast pelo apiClient
            }
            setStatusMessage('Quase lá...');
            setDadosProntos(true);
        }

        init();
    }, [loading, user, preCarregarEscolas]);

    const showSplash = loading || (user && !dadosProntos);

    if (showSplash) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryDarker }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={{ marginTop: 15, color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>
                    {loading ? 'Verificando credenciais...' : statusMessage}
                </Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.gray100 } }}>
                {user ? (
                    <Stack.Screen name="AppTabs" component={AppTabs} />
                ) : (
                    <Stack.Screen name="Login" component={Login} />
                )}
            </Stack.Navigator>
            <Toast />
        </NavigationContainer>
    );
}

export function Routes() {
    return (
        <AuthProvider>
            <MainNavigator />
        </AuthProvider>
    );
}
