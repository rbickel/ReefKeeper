import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const sharedColors = {
    reef: '#0a84ff',
    reefDark: '#0a1628',
    coral: '#ff6b6b',
    seaGreen: '#00b894',
    sand: '#f9ca24',
    deepBlue: '#0652DD',
    overdue: '#e74c3c',
    today: '#f39c12',
    upcoming: '#3498db',
    later: '#95a5a6',
};

export const LightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: sharedColors.reef,
        secondary: sharedColors.seaGreen,
        tertiary: sharedColors.coral,
        background: '#f0f4f8',
        surface: '#ffffff',
        surfaceVariant: '#e8eef4',
        error: sharedColors.overdue,
    },
    custom: sharedColors,
};

export const DarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: sharedColors.reef,
        secondary: sharedColors.seaGreen,
        tertiary: sharedColors.coral,
        background: sharedColors.reefDark,
        surface: '#1a2a44',
        surfaceVariant: '#243452',
        error: sharedColors.overdue,
    },
    custom: sharedColors,
};

export type AppTheme = typeof LightTheme;
