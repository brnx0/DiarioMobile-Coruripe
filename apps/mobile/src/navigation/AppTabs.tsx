import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomNavigation } from '../../components/BottomNavigation';
import Home from '../../templates/home/Home';
import TurmasDetails from '../../templates/turmas/TurmasDetails';
import ReplicarConteudo from '../../templates/turmas/ReplicarConteudo';
import CalendarioEscolar from '../../templates/calendarioEscolar/CalendarioEscolar';
import ProximasAulas from '../../templates/ProximasAulas/ProximasAulas';
import ListaPlanosAulas from '../../templates/planosAulas/ListaPlanosAulas';
import PlanosAulas from '../../templates/planosAulas/PlanosAulas';
import type { LessonPlan } from '@diariomobile/shared-types';

export type TurmasStackParamList = {
    TurmasDetailsScreen: undefined;
    ReplicarConteudo: {
        dicCod: number;
        turmaId: number;
        disciplinaId: number;
        conteudo: string;
        metodologia: string;
        nomeTurma: string;
        onConteudoMetodologiaSalvos: (novoConteudo: string, novaMetodologia: string) => void;
    };
};

export type PlanosStackParamList = {
    ListaPlanosAulasScreen: undefined;
    PlanosAulasScreen: { planoAula?: LessonPlan };
};

export type AppTabParamList = {
    HomeTab: undefined;
    TurmasTab: undefined;
    PlanosTab: undefined;
    CalendarioTab: undefined;
    AulasTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const TurmasStack = createNativeStackNavigator<TurmasStackParamList>();
const PlanosStack = createNativeStackNavigator<PlanosStackParamList>();

function TurmasTabStack() {
    return (
        <TurmasStack.Navigator screenOptions={{ headerShown: false }}>
            <TurmasStack.Screen name="TurmasDetailsScreen" component={TurmasDetails} />
            <TurmasStack.Screen name="ReplicarConteudo" component={ReplicarConteudo} />
        </TurmasStack.Navigator>
    );
}

function PlanosTabStack() {
    return (
        <PlanosStack.Navigator screenOptions={{ headerShown: false }}>
            <PlanosStack.Screen name="ListaPlanosAulasScreen" component={ListaPlanosAulas} />
            <PlanosStack.Screen name="PlanosAulasScreen" component={PlanosAulas} />
        </PlanosStack.Navigator>
    );
}

export function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomNavigation {...props} />}
            initialRouteName="HomeTab"
            backBehavior="history"
        >
            <Tab.Screen name="TurmasTab" component={TurmasTabStack} />
            <Tab.Screen name="PlanosTab" component={PlanosTabStack} />
            <Tab.Screen name="HomeTab" component={Home} />
            <Tab.Screen name="CalendarioTab" component={CalendarioEscolar} />
            <Tab.Screen name="AulasTab" component={ProximasAulas} />
        </Tab.Navigator>
    );
}
