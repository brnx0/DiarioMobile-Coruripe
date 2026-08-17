import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../src/constants/colors';

const THEME_COLOR = colors.primary;

interface AnimatedIconProps {
    focused: boolean;
    children: React.ReactNode;
}

function AnimatedIcon({ focused, children }: AnimatedIconProps) {
    const scale = useRef(new Animated.Value(focused ? 1.3 : 1)).current;
    const translateY = useRef(new Animated.Value(focused ? -6 : 0)).current;
    const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: focused ? 1.35 : 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
            }),
            Animated.spring(translateY, {
                toValue: focused ? -8 : 0,
                useNativeDriver: true,
                speed: 20,
                bounciness: 6,
            }),
            Animated.timing(opacity, {
                toValue: focused ? 1 : 0.65,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    return (
        <Animated.View style={{ transform: [{ scale }, { translateY }], opacity }}>
            {children}
        </Animated.View>
    );
}

interface TabConfig {
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
}

const TABS: TabConfig[] = [
    { name: 'TurmasTab', icon: 'book-education', label: 'Turmas' },
    { name: 'PlanosTab', icon: 'book-open-outline', label: 'Planos' },
    { name: 'HomeTab', icon: 'home', label: 'Início' },
    { name: 'CalendarioTab', icon: 'calendar-month-outline', label: 'Calendário' },
    { name: 'AulasTab', icon: 'calendar-clock', label: 'Aulas' },
];

export function BottomNavigation({ state, navigation, insets }: BottomTabBarProps) {
    const currentRouteName = state.routes[state.index].name;

    const isFocused = (name: string) => currentRouteName === name;

    const iconColor = (name: string) =>
        isFocused(name) ? '#FFFFFF' : 'rgba(255,255,255,0.65)';

    return (
        <View
            style={{
                backgroundColor: THEME_COLOR,
                paddingBottom: Math.max(insets.bottom, 16),
                paddingTop: 14,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                elevation: 12,
            }}
            className="shadow-2xl z-20"
        >
            <View className="flex-row items-center justify-between px-6">
                {TABS.map((tab) => {
                    const focused = isFocused(tab.name);
                    const isCenter = tab.name === 'HomeTab';

                    if (isCenter) {
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={() => {
                                    if (__DEV__) console.log('[Tab press]', tab.name);
                                    navigation.navigate(tab.name as never);
                                }}
                                activeOpacity={0.9}
                                style={{ marginTop: -32 }}
                            >
                                <Animated.View
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 32,
                                        backgroundColor: '#FFFFFF',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        elevation: 10,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.2,
                                        shadowRadius: 8,
                                    }}
                                >
                                    <Ionicons name="home" size={28} color={THEME_COLOR} />
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            onPress={() => {
                                if (__DEV__) console.log('[Tab press]', tab.name);
                                navigation.navigate(tab.name as never);
                            }}
                            activeOpacity={0.7}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 8 }}
                        >
                            <AnimatedIcon focused={focused}>
                                <MaterialCommunityIcons
                                    name={tab.icon}
                                    size={26}
                                    color={iconColor(tab.name)}
                                />
                            </AnimatedIcon>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
