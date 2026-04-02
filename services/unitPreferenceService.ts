import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnitPreferences, DEFAULT_UNIT_PREFERENCES } from '../models/UnitPreference';

const STORAGE_KEY = '@reef_keeper_unit_preferences';

export async function getUnitPreferences(): Promise<UnitPreferences> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return { ...DEFAULT_UNIT_PREFERENCES };
  return JSON.parse(json) as UnitPreferences;
}

export async function saveUnitPreferences(prefs: UnitPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
