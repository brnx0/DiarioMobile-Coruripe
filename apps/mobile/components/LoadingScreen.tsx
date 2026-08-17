import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
    <ActivityIndicator size="large" color="#0B4F93" /> 
    <Text style={{ marginTop: 10, color: '#333' }}>Carregando dados...</Text>
  </View>
);

export default LoadingScreen;