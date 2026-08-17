import React from 'react';
import { ActivityIndicator, Modal, View, Text } from 'react-native';

const colors = {
    primaryBlue: '#0B4F93',
};

interface LoadingSaveProps {
    title: string;
    subtitle?: string;
    visible?: boolean;
}

export const LoadingSave: React.FC<LoadingSaveProps> = ({ title, subtitle, visible = true }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => { }}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                }}
            >
                <View
                    style={{
                        paddingVertical: 22,
                        paddingHorizontal: 28,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 6,
                        marginHorizontal: 20,
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primaryBlue} />
                    <Text
                        style={{
                            marginTop: 12,
                            color: colors.primaryBlue,
                            fontWeight: '800',
                            fontSize: 16,
                            textAlign: 'center',
                        }}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={{
                                marginTop: 4,
                                color: '#4B5563',
                                fontSize: 13,
                                textAlign: 'center',
                            }}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
};
