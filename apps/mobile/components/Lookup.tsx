import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LookupProps<T> {
  label?: string;
  data: T[];
  displayKey: keyof T;
  uniqueKey: keyof T;
  onSelect: (item: T) => void;
  onSearch?: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  filter?: boolean;
  disabled?: boolean;
  selectedItem?: T | null;
}

function Lookup<T extends Record<string, any>>({
  label,
  data = [],
  displayKey,
  uniqueKey,
  onSelect,
  onSearch,
  isLoading = false,
  placeholder = "Toque para selecionar...",
  filter = true,
  disabled = false,
  selectedItem
}: LookupProps<T>) {

  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [internalItem, setInternalItem] = useState<T | null>(selectedItem || null);

  useEffect(() => {
    if (selectedItem !== undefined) {
      setInternalItem(selectedItem);
    }
  }, [selectedItem]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleTypeSearch = (text: string) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
      return;
    }
    if (text === '') {
      setFilteredData(data);
    } else if (data.length > 0) {
      const novaLista = data.filter(item => {
        const val = String(item[displayKey]).toLowerCase();
        return val.includes(text.toLowerCase());
      });
      setFilteredData(novaLista);
    }
  };

  const handleSelect = (item: T) => {
    setInternalItem(item);
    onSelect(item);
    setVisible(false);
    setSearchText('');
  };

  return (
    <View className={`w-full mb-3 ${disabled ? 'opacity-50' : ''}`} pointerEvents={disabled ? 'none' : 'auto'}>
      {label && <Text className="text-gray-700 font-bold mb-2 text-sm">{label}</Text>}
      <TouchableOpacity
        className="border border-gray-300 bg-white rounded-lg p-3 shadow-sm"
        onPress={() => setVisible(true)}
      >
        <Text className={`justify-center text-sm ${!internalItem ? 'text-gray-400' : 'text-gray-900'}`}>
          {internalItem ? String(internalItem[displayKey]) : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        visible={visible}
        onRequestClose={() => setVisible(false)}
        // Adicionamos presentationStyle para garantir comportamento consistente no iOS
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          className="flex-1 bg-gray-50"
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800"></Text>
            <TouchableOpacity onPress={() => setVisible(false)} className="p-2">
              <Text className="text-blue-600 font-semibold text-base">Fechar</Text>
            </TouchableOpacity>
          </View>
          {filter && (
            <View className="p-4 bg-white">
              <TextInput
                className="justify-center bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-3"
                placeholder="Digite para pesquisar..."
                placeholderTextColor={'#9CA3AF'}
                value={searchText}
                onChangeText={handleTypeSearch}
                returnKeyType="done"

              />
            </View>
          )}
          {isLoading ? (
            <View className="mt-10 flex-1 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-center text-gray-500 mt-2">Buscando...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => String(item[uniqueKey])}
              contentContainerStyle={{ flexGrow: 1 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 bg-white border-b border-gray-300 active:bg-gray-100"
                  onPress={() => handleSelect(item)}
                >
                  <Text className="text-sm text-gray-800">
                    {String(item[displayKey])}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="mt-10 items-center px-4">
                  <Text className="text-center text-gray-400 text-base">
                    {searchText.length > 0 ? "Nenhum resultado encontrado." : "Nenhum dado disponível."}
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
export default Lookup;