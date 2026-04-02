import {
    DEFAULT_UNIT_PREFERENCES,
    celsiusToFahrenheit,
    fahrenheitToCelsius,
    litersToGallons,
    gallonsToLiters,
    convertTemperatureForDisplay,
    convertTemperatureForStorage,
    convertVolumeForDisplay,
    convertVolumeForStorage,
    formatTemperature,
    formatVolume,
} from '../../models/UnitPreference';

describe('UnitPreference', () => {
    describe('DEFAULT_UNIT_PREFERENCES', () => {
        it('should default to metric system', () => {
            expect(DEFAULT_UNIT_PREFERENCES.system).toBe('metric');
            expect(DEFAULT_UNIT_PREFERENCES.temperature).toBe('°C');
            expect(DEFAULT_UNIT_PREFERENCES.volume).toBe('L');
        });
    });

    describe('celsiusToFahrenheit', () => {
        it('should convert 0°C to 32°F', () => {
            expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 1);
        });

        it('should convert 25.6°C to 78°F', () => {
            expect(celsiusToFahrenheit(25.6)).toBeCloseTo(78.08, 0);
        });

        it('should convert 100°C to 212°F', () => {
            expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 1);
        });

        it('should handle negative temperatures', () => {
            expect(celsiusToFahrenheit(-40)).toBeCloseTo(-40, 1);
        });
    });

    describe('fahrenheitToCelsius', () => {
        it('should convert 32°F to 0°C', () => {
            expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 1);
        });

        it('should convert 78°F to 25.6°C', () => {
            expect(fahrenheitToCelsius(78)).toBeCloseTo(25.6, 1);
        });

        it('should convert 212°F to 100°C', () => {
            expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 1);
        });

        it('should handle negative temperatures', () => {
            expect(fahrenheitToCelsius(-40)).toBeCloseTo(-40, 1);
        });
    });

    describe('litersToGallons', () => {
        it('should convert 284L to ~75 gal', () => {
            expect(litersToGallons(284)).toBeCloseTo(75, 0);
        });

        it('should convert 1L to ~0.264 gal', () => {
            expect(litersToGallons(1)).toBeCloseTo(0.264, 2);
        });

        it('should handle 0', () => {
            expect(litersToGallons(0)).toBe(0);
        });

        it('should handle very large volumes', () => {
            expect(litersToGallons(10000)).toBeCloseTo(2641.72, 0);
        });
    });

    describe('gallonsToLiters', () => {
        it('should convert 75 gal to ~284 L', () => {
            expect(gallonsToLiters(75)).toBeCloseTo(283.9, 0);
        });

        it('should convert 1 gal to ~3.785 L', () => {
            expect(gallonsToLiters(1)).toBeCloseTo(3.785, 2);
        });

        it('should handle 0', () => {
            expect(gallonsToLiters(0)).toBe(0);
        });

        it('should handle very large volumes', () => {
            expect(gallonsToLiters(1000)).toBeCloseTo(3785.41, 0);
        });
    });

    describe('convertTemperatureForDisplay', () => {
        it('should return same value for °C', () => {
            expect(convertTemperatureForDisplay(25.6, '°C')).toBe(25.6);
        });

        it('should convert stored Celsius to Fahrenheit for °F', () => {
            expect(convertTemperatureForDisplay(25.6, '°F')).toBeCloseTo(78.08, 0);
        });

        it('should handle 0°C', () => {
            expect(convertTemperatureForDisplay(0, '°F')).toBeCloseTo(32, 1);
        });

        it('should handle negative temps', () => {
            expect(convertTemperatureForDisplay(-10, '°C')).toBe(-10);
            expect(convertTemperatureForDisplay(-10, '°F')).toBeCloseTo(14, 1);
        });
    });

    describe('convertTemperatureForStorage', () => {
        it('should return same value for °C', () => {
            expect(convertTemperatureForStorage(25.6, '°C')).toBe(25.6);
        });

        it('should convert Fahrenheit input to Celsius for storage', () => {
            expect(convertTemperatureForStorage(78, '°F')).toBeCloseTo(25.6, 1);
        });

        it('should handle 32°F → 0°C', () => {
            expect(convertTemperatureForStorage(32, '°F')).toBeCloseTo(0, 1);
        });
    });

    describe('convertVolumeForDisplay', () => {
        it('should return same value for L', () => {
            expect(convertVolumeForDisplay(284, 'L')).toBe(284);
        });

        it('should convert stored liters to gallons for gal', () => {
            expect(convertVolumeForDisplay(284, 'gal')).toBeCloseTo(75, 0);
        });

        it('should handle 0', () => {
            expect(convertVolumeForDisplay(0, 'gal')).toBe(0);
        });
    });

    describe('convertVolumeForStorage', () => {
        it('should return same value for L', () => {
            expect(convertVolumeForStorage(284, 'L')).toBe(284);
        });

        it('should convert gallon input to liters for storage', () => {
            expect(convertVolumeForStorage(75, 'gal')).toBeCloseTo(283.9, 0);
        });

        it('should handle 0', () => {
            expect(convertVolumeForStorage(0, 'gal')).toBe(0);
        });
    });

    describe('formatTemperature', () => {
        it('should format Celsius values', () => {
            expect(formatTemperature(25.6, '°C')).toBe('25.6°C');
        });

        it('should format Fahrenheit values with conversion', () => {
            expect(formatTemperature(25.6, '°F')).toBe('78.1°F');
        });
    });

    describe('formatVolume', () => {
        it('should format liter values', () => {
            expect(formatVolume(284, 'L')).toBe('284 L');
        });

        it('should format gallon values with conversion', () => {
            expect(formatVolume(284, 'gal')).toBe('75 gal');
        });
    });
});
