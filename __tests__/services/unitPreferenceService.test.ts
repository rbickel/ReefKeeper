import AsyncStorage from '@react-native-async-storage/async-storage';
import * as unitPreferenceService from '../../services/unitPreferenceService';
import { DEFAULT_UNIT_PREFERENCES } from '../../models/UnitPreference';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

describe('unitPreferenceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUnitPreferences', () => {
        it('should return defaults when nothing stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await unitPreferenceService.getUnitPreferences();

            expect(result).toEqual(DEFAULT_UNIT_PREFERENCES);
            expect(result.system).toBe('metric');
            expect(result.temperature).toBe('°C');
            expect(result.volume).toBe('L');
        });

        it('should return stored preferences', async () => {
            const storedPrefs = {
                system: 'imperial',
                temperature: '°F',
                volume: 'gal',
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedPrefs));

            const result = await unitPreferenceService.getUnitPreferences();

            expect(result.system).toBe('imperial');
            expect(result.temperature).toBe('°F');
            expect(result.volume).toBe('gal');
        });

        it('should read from correct storage key', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            await unitPreferenceService.getUnitPreferences();

            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@reef_keeper_unit_preferences');
        });
    });

    describe('saveUnitPreferences', () => {
        it('should persist preferences to AsyncStorage', async () => {
            const prefs = {
                system: 'imperial' as const,
                temperature: '°F' as const,
                volume: 'gal' as const,
            };

            await unitPreferenceService.saveUnitPreferences(prefs);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_unit_preferences',
                JSON.stringify(prefs)
            );
        });

        it('should persist metric preferences', async () => {
            await unitPreferenceService.saveUnitPreferences(DEFAULT_UNIT_PREFERENCES);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_unit_preferences',
                JSON.stringify(DEFAULT_UNIT_PREFERENCES)
            );
        });
    });
});
