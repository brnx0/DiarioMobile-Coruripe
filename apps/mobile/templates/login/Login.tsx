import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Eye, EyeOff, User, Lock } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';

export default function Login() {
    const { signIn } = useAuth();
    const { showToast } = useAlert();

    const [login, setLogin] = useState('');
    const senhaRef = useRef<TextInput>(null);
    const [senha, setSenha] = useState('');
    const [isSenhaVisivel, setIsSenhaVisivel] = useState(false);
    const [isLoading, setIsloading] = useState(false);

    const resetPassword = () => {
        Alert.alert('Atenção', 'Para resetar sua senha entre em contato com o suporte do sistema.');
    };

    const handleLogin = async () => {
        if (!login || !senha) {
            showToast('Atenção', 'warning', 'O usuário e a senha não podem ser vazios.');
            return;
        }

        setIsloading(true);
        try {
            const result = await signIn(login, senha);
            if (!result.ok && result.errorMessage) {
                showToast('Falha no login', 'error', result.errorMessage);
            }
        } finally {
            setIsloading(false);
        }
    };

    const toggleVisibilidade = () => setIsSenhaVisivel((v) => !v);

    const LoadingOverlay = () => (
        <View className="flex-1 inset-0 justify-center items-center z-50">
            <View className="mb-5">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text className={`text-lg font-semibold text-center text-[${colors.primary}]`}>Aguarde...</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-100 relative">
            <View className="absolute top-[-100] left-[-50] w-96 h-96 bg-blue-200 rounded-full opacity-20" />
            <View className="absolute bottom-[-50] right-[-50] w-80 h-80 bg-indigo-200 rounded-full opacity-20" />
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            >
                <View className="items-center mb-10">
                    <Text className="text-sm text-gray-400 font-medium tracking-wide">
                        Bem-vindo de volta
                    </Text>
                    <Text className="text-5xl font-extrabold text-[#216FAA] mt-2 tracking-tight">
                        Diário Mobile
                    </Text>
                    {!!process.env.EXPO_PUBLIC_MUNICIPALITY_NAME && (
                        <Text className="text-base text-gray-600 font-semibold tracking-widest uppercase mt-3">
                            {process.env.EXPO_PUBLIC_MUNICIPALITY_NAME}
                        </Text>
                    )}
                    <Text className="text-sm text-gray-500 mt-3">
                        Acesse sua conta para continuar
                    </Text>
                </View>
                <View className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100">
                    {isLoading ? (
                        <LoadingOverlay />
                    ) : (
                        <>
                            <View className="flex-row items-center border-b border-gray-200 p-3 mb-6 bg-gray-50 rounded-t-lg">
                                <User size={22} color="#666" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-lg text-gray-700"
                                    placeholder="Usuário"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    value={login}
                                    onChangeText={setLogin}
                                    onSubmitEditing={() => senhaRef.current?.focus()}
                                    autoCorrect={false}
                                />
                            </View>

                            <View className="flex-row items-center border-b border-gray-200 p-3 mb-8 bg-gray-50 rounded-t-lg">
                                <Lock size={22} color="#666" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-lg text-gray-700"
                                    placeholder="Senha"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!isSenhaVisivel}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    value={senha}
                                    onChangeText={setSenha}
                                    ref={senhaRef}
                                    onSubmitEditing={handleLogin}
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={toggleVisibilidade}>
                                    {isSenhaVisivel ? <Eye size={22} color="#216FAA" /> : <EyeOff size={22} color="gray" />}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="w-full py-4 rounded-xl bg-[#216FAA] shadow-lg shadow-blue-300"
                                onPress={handleLogin}
                            >
                                <Text className="text-center text-white text-lg font-bold">
                                    Entrar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="mt-6 items-center" onPress={resetPassword}>
                                <Text className="text-gray-500 text-sm">
                                    Esqueceu sua senha? <Text className="text-[#216FAA] font-bold">Recuperar</Text>
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                {process.env.EXPO_PUBLIC_SHOW_MUNICIPALITY_LOGO === 'true' && (
                    <View className="items-center mt-10 opacity-90">
                        <Image
                            className="h-16 w-full"
                            resizeMode="contain"
                            source={require('../../assets/LogoMunicipio.png')}
                        />
                    </View>
                )}
            </KeyboardAwareScrollView>
        </View>
    );
}
