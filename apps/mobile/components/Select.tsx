import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

// Definir o tipo dos itens (se estiveres a usar TypeScript)
// Se for JS puro, podes ignorar as interfaces
interface Option {
  label: string;
  value: string | number;
}

interface SelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

export default function Select({ options, value, onChange, placeholder = "Selecione..." }: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Encontra o texto da opção selecionada para mostrar no botão
  
  const selectedLabel = options.find(opt => opt.value == value)?.label || placeholder;

  return (
    <>
      {/* 1. O CAMPO DE INPUT (Botão) */}
      <TouchableOpacity
        className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white justify-center"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row justify-between items-center">
          <Text className={`${value ? 'text-gray-900' : 'text-gray-400'} font-bold`}>
            {selectedLabel}
          </Text>
          <Text className="ml-1 text-gray-400 text-xs">▼</Text>
        </View>
      </TouchableOpacity>

      {/* 2. O MODAL (A Lista) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Fundo escuro que fecha o modal ao clicar fora */}
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center p-6"
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          {/* Caixa Branca da Lista */}
          <View className="bg-white w-full max-h-[50%] rounded-xl shadow-lg overflow-hidden">
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-gray-100 active:bg-blue-50"
                  onPress={() => {
                    onChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text className={`text-base ${item.value === value ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}