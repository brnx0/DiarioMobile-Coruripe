import React from 'react';
import GenericPicker, { PickerItem } from './GenericPicker';

interface AnoPickerProps {
    anos: PickerItem[];
    selectedAno: PickerItem | null;
    onSelect: (ano: PickerItem) => void;
    isLoading?: boolean;
}

const AnoPicker: React.FC<AnoPickerProps> = (props) => {
    return (
        <GenericPicker
            label="Ano Letivo"
            placeholder="Selecione o ano"
            items={props.anos}
            selectedItem={props.selectedAno}
            onSelect={props.onSelect}
            isLoading={props.isLoading}
            icon="calendar-range"
        />
    );
};

export default AnoPicker;