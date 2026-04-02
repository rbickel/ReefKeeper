export type UnitSystem = 'metric' | 'imperial';

export type TemperatureUnit = '°C' | '°F';
export type VolumeUnit = 'L' | 'gal';

export interface UnitPreferences {
  system: UnitSystem;
  temperature: TemperatureUnit;
  volume: VolumeUnit;
}

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  system: 'metric',
  temperature: '°C',
  volume: 'L',
};

// --- Conversion utilities ---

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function litersToGallons(l: number): number {
  return l * 0.264172;
}

export function gallonsToLiters(g: number): number {
  return g * 3.78541;
}

// --- Format helpers ---

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  if (unit === '°F') {
    return `${celsiusToFahrenheit(celsius).toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

export function formatVolume(liters: number, unit: VolumeUnit): string {
  if (unit === 'gal') {
    return `${litersToGallons(liters).toFixed(0)} gal`;
  }
  return `${liters.toFixed(0)} L`;
}

// --- Display/storage conversion ---
// Data is ALWAYS stored in metric (Celsius, liters).
// These functions convert between stored metric values and display units.

export function convertTemperatureForDisplay(storedCelsius: number, unit: TemperatureUnit): number {
  if (unit === '°F') {
    return celsiusToFahrenheit(storedCelsius);
  }
  return storedCelsius;
}

export function convertVolumeForDisplay(storedLiters: number, unit: VolumeUnit): number {
  if (unit === 'gal') {
    return litersToGallons(storedLiters);
  }
  return storedLiters;
}

export function convertTemperatureForStorage(displayValue: number, unit: TemperatureUnit): number {
  if (unit === '°F') {
    return fahrenheitToCelsius(displayValue);
  }
  return displayValue;
}

export function convertVolumeForStorage(displayValue: number, unit: VolumeUnit): number {
  if (unit === 'gal') {
    return gallonsToLiters(displayValue);
  }
  return displayValue;
}
