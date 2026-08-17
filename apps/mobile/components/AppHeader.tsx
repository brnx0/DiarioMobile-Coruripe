import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/colors';

interface AppHeaderProps {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
    children?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export function AppHeader({
    title,
    showBack = true,
    onBackPress,
    rightComponent,
    children,
    containerStyle,
}: AppHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // Reativo: re-renderiza quando histórico muda
    const canGoBack = useNavigationState(() => navigation.canGoBack());

    const shouldShowBack = showBack && canGoBack;

    const handleGoBack = () => {
        if (onBackPress) {
            onBackPress();
            return;
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View
            className="rounded-b-[32px] shadow-lg z-10 relative overflow-hidden"
            style={[
                {
                    backgroundColor: colors.primary,
                    paddingTop: Math.max(insets.top, 16) + 8,
                    paddingBottom: 14,
                    elevation: 6,
                },
                containerStyle,
            ]}
        >
            <StatusBar style="light" backgroundColor="transparent" translucent />
            <View className="flex-row items-center justify-between px-6 mb-1">
                {shouldShowBack ? (
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10" />
                )}

                <Text
                    className="text-white text-lg font-bold text-center flex-1 mx-2"
                    numberOfLines={1}
                >
                    {title}
                </Text>

                {rightComponent ? rightComponent : <View className="w-10" />}
            </View>

            {children && <View className="mt-2">{children}</View>}
        </View>
    );
}
