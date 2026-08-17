import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TabProps {
    tabs: string[];
    activeTab: string;
    setActiveTab: (tabName: string) => void;
    disabledTabs?: string[];
    onDisabledPress?: (tabName: string) => void;
}

const style = StyleSheet.create({
    activeContainer: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
    },
});

const activeTextClasses = 'text-[#0B4F93]';
const inactiveTextClasses = 'text-gray-500';
const disabledTextClasses = 'text-gray-400';

const SegmentedControlTabs: React.FC<TabProps> = ({
    tabs,
    activeTab,
    setActiveTab,
    disabledTabs = [],
    onDisabledPress,
}) => {
    return (
        <View className="mx-4 mt-6 mb-6 bg-gray-200 p-1 rounded-xl flex-row">
            {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const isDisabled = disabledTabs.includes(tab);

                const handlePress = () => {
                    if (isDisabled) {
                        onDisabledPress?.(tab);
                        return;
                    }
                    setActiveTab(tab);
                };

                const textClasses = isDisabled
                    ? disabledTextClasses
                    : isActive
                        ? activeTextClasses
                        : inactiveTextClasses;

                return (
                    <TouchableOpacity
                        key={tab}
                        onPress={handlePress}
                        activeOpacity={isDisabled ? 0.5 : 0.7}
                        className="flex-1 py-2 px-1 rounded-lg items-center justify-center flex-row"
                        style={isActive && !isDisabled ? style.activeContainer : {}}
                    >
                        {isDisabled && (
                            <MaterialCommunityIcons
                                name="lock-outline"
                                size={12}
                                color="#9CA3AF"
                                style={{ marginRight: 4 }}
                            />
                        )}
                        <Text
                            className={`font-semibold text-xs text-center ${textClasses}`}
                            numberOfLines={1}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default SegmentedControlTabs;

