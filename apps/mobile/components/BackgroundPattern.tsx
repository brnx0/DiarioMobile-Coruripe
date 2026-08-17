import React from 'react';
import { Image, StyleSheet } from 'react-native';

const PATTERN = require('../assets/school_pattern.png');

interface BackgroundPatternProps {
    opacity?: number;
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({ opacity = 0.12 }) => (
    <Image
        source={PATTERN}
        style={[StyleSheet.absoluteFillObject, { opacity }]}
        resizeMode="cover"
    />
);
