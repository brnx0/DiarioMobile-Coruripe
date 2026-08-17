import { updateContent } from '@/services/diary';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TurmasStackParamList } from '../../src/navigation/AppTabs';
import { colors } from '../../src/constants/colors';
import { useAlert } from '../../src/context/AlertContext';

interface ConteudoMetodologiaProps {
    setActiveTab: (tabName: string) => void;
    dicCod: number;
    Conteudo?: string;
    Metodologia?: string;
    turmaId: number;
    disciplinaId: number;
    nomeTurma: string;
    onConteudoMetodologiaSalvos?: (conteudo: string, metodologia: string) => void;
    onSavingChange?: (isSaving: boolean) => void;
}

type NavigationProp = NativeStackNavigationProp<TurmasStackParamList, 'TurmasDetailsScreen'>;

const ConteudoMetodologia: React.FC<ConteudoMetodologiaProps> = ({
    setActiveTab,
    dicCod,
    Conteudo,
    Metodologia,
    turmaId,
    disciplinaId,
    nomeTurma,
    onConteudoMetodologiaSalvos,
    onSavingChange,
}) => {
    const [conteudoValue, setConteudoValue] = useState<string>(Conteudo ?? '');
    const [metodologiaValue, setMetodologiaValue] = useState<string>(Metodologia ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useAlert();

    const navigation = useNavigation<NavigationProp>();

    const handleReplicarConteudo = () => {

        navigation.navigate('ReplicarConteudo', {
            dicCod,
            turmaId,
            disciplinaId,
            conteudo: conteudoValue,
            metodologia: metodologiaValue,
            nomeTurma,
            onConteudoMetodologiaSalvos: (novoConteudo: string, novaMetodologia: string) => {

                setConteudoValue(novoConteudo);
                setMetodologiaValue(novaMetodologia);

                if (onConteudoMetodologiaSalvos) {
                    onConteudoMetodologiaSalvos(novoConteudo, novaMetodologia);
                }
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            if (onSavingChange) onSavingChange(true);
            await updateContent(dicCod, conteudoValue, metodologiaValue);

            if (onConteudoMetodologiaSalvos) {
                onConteudoMetodologiaSalvos(conteudoValue, metodologiaValue);
            }

            showToast('Sucesso!', 'success', 'O conteúdo e/ou metodologia foi salvo com sucesso.');
        } catch (err) {
            console.error('Erro ao salvar conteúdo:', err);
            showToast('Erro', 'error', 'Falha ao salvar o conteúdo e/ou metodologia. Tente novamente.');
        } finally {
            setIsSaving(false);
            if (onSavingChange) onSavingChange(false);
        }
    };

    const handleCancel = () => {
        setActiveTab('Frequências');
    };

    return (
        <View className="flex-1 p-5">
            <View className="flex flex-row items-center justify-between mb-4">
                <Text className="font-bold text-base">
                    Conteúdo / Metodologia
                </Text>

                <TouchableOpacity
                    className="py-3 px-5 rounded-lg min-w-[100px]"
                    style={{ backgroundColor: colors.primaryDarker }}
                    onPress={handleReplicarConteudo}
                >
                    <Text className="text-white font-bold text-center text-base">
                        Replicar conteúdo
                    </Text>
                </TouchableOpacity>
            </View>
            <Text className="text-base font-semibold mt-4 mb-1 text-gray-700">
                Conteúdo:
            </Text>
            <TextInput
                className="min-h-[100px] border border-gray-300 rounded-lg p-3 bg-white text-base"
                onChangeText={(text) => {
                    setConteudoValue(text);
                }}
                value={conteudoValue}
                placeholder="Preencha o conteúdo dado em sala de aula..."
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
            />

            <Text className="text-base font-semibold mt-4 mb-1 text-gray-700">
                Metodologia:
            </Text>
            <TextInput
                className="min-h-[100px] border border-gray-300 rounded-lg p-3 bg-white text-base"
                onChangeText={(text) => {
                    setMetodologiaValue(text);
                }}
                value={metodologiaValue}
                placeholder="Insira a metodologia utilizada em sala de aula..."
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
            />

            <View className="flex-row justify-center mt-8 gap-x-3">
                <TouchableOpacity
                    className="py-3 px-5 rounded-lg bg-gray-500 min-w-[100px]"
                    onPress={handleCancel}
                    disabled={isSaving}
                >
                    <Text className="text-white font-bold text-center text-base" style={{ color: colors.white }}>
                        Voltar
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="py-3 px-5 rounded-lg bg-green-600 min-w-[100px]" style={{ backgroundColor: colors.success }}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <View className="flex-row items-center justify-center space-x-2">
                        {isSaving && (
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF" 
                                className="mr-2"
                            />
                        )}
                        <Text className="text-white font-bold text-base text-center">
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ConteudoMetodologia;