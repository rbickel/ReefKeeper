import { useCallback, useEffect, useState } from 'react';
import {
  UnitPreferences,
  UnitSystem,
  TemperatureUnit,
  VolumeUnit,
  DEFAULT_UNIT_PREFERENCES,
} from '../models/UnitPreference';
import * as unitPreferenceService from '../services/unitPreferenceService';

export function useUnitPreferences() {
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_UNIT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const prefs = await unitPreferenceService.getUnitPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load unit preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setSystem = useCallback(async (system: UnitSystem) => {
    const updated: UnitPreferences = {
      system,
      temperature: system === 'metric' ? '°C' : '°F',
      volume: system === 'metric' ? 'L' : 'gal',
    };
    await unitPreferenceService.saveUnitPreferences(updated);
    setPreferences(updated);
  }, []);

  const setTemperatureUnit = useCallback(async (unit: TemperatureUnit) => {
    const updated: UnitPreferences = { ...preferences, temperature: unit };
    await unitPreferenceService.saveUnitPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const setVolumeUnit = useCallback(async (unit: VolumeUnit) => {
    const updated: UnitPreferences = { ...preferences, volume: unit };
    await unitPreferenceService.saveUnitPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  return {
    preferences,
    loading,
    setSystem,
    setTemperatureUnit,
    setVolumeUnit,
  };
}
