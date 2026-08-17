// components/ProfileMenuDropdown.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- DOCUMENTAÇÃO DO COMPONENTE ---
// Componente: ProfileMenuDropdown
// props: isVisible (boolean para mostrar/esconder), onClose (função para fechar)

interface ProfileMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const ProfileMenuDropdown: React.FC<ProfileMenuProps> = ({ isVisible, onClose, onLogout }) => {
  if (!isVisible) {
    return null; // Não renderiza nada se não estiver visível
  }

  // --- DOCUMENTAÇÃO DOS DADOS ---
  const menuItems = [
    {
      label: 'Sair (Logout)',
      icon: 'log-out-outline',
      action: () => onLogout(),
      color: '#EF4444' // Vermelho para destaque
    },
  ];

  return (
    <View className="absolute top-24 right-6 bg-white rounded-lg shadow-2xl p-2 z-50 border border-gray-100">
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={item.label}
          onPress={() => {
            item.action(); // Executa a ação (navegação ou logout)
            onClose(); // Fecha o dropdown
          }}
          // Aplica padding, hover/active effects e separa com borda (exceto no último)
          className={`flex-row items-center p-3 w-40 active:bg-gray-100 ${index < menuItems.length - 1 ? 'border-b border-gray-200' : ''}`}>
          <View className="mr-3">
            <Ionicons
              name={item.icon as any}
              size={25}
              color={item.color}
            />
          </View>
          <Text className="text-gray-800 text-base ml-2">{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileMenuDropdown;