import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Routes } from './src/routes';
import { AlertProvider } from './src/context/AlertContext';
import { SelectionProvider } from './src/context/SelectionContext';

const App = () => {
    return (
        <SafeAreaProvider>
            <AlertProvider>
                <SelectionProvider>
                    <Routes />
                </SelectionProvider>
            </AlertProvider>
        </SafeAreaProvider>
    );
};

export default App;
