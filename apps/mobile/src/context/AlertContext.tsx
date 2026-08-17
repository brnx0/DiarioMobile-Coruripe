import React, { createContext, useCallback, useContext } from 'react';
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface AlertContextData {
    showToast: (text1: string, type?: ToastType, text2?: string) => void;
}

const AlertContext = createContext<AlertContextData | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const showToast = useCallback((text1: string, type: ToastType = 'info', text2?: string) => {
        Toast.show({
            type: type === 'warning' ? 'error' : type,
            text1,
            text2,
            position: 'top',
            visibilityTime: 4000,
        });
    }, []);

    return (
        <AlertContext.Provider value={{ showToast }}>
            {children}
        </AlertContext.Provider>
    );
};

export function useAlert() {
    const ctx = useContext(AlertContext);
    if (!ctx) {
        throw new Error('useAlert deve ser usado dentro de AlertProvider');
    }
    return ctx;
}
