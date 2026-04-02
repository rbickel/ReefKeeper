import AsyncStorage from '@react-native-async-storage/async-storage';
import * as waterLogService from '../../services/waterLogService';
import { WaterLog, WaterReading } from '../../models/WaterLog';
import { WaterParameterId } from '../../models/WaterParameter';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123'),
}));

describe('waterLogService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWaterLogs', () => {
        it('should return empty array when nothing stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await waterLogService.getWaterLogs();

            expect(result).toEqual([]);
        });

        it('should return parsed water logs from storage', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [
                        { parameterId: 'temperature', value: 25.7 },
                        { parameterId: 'salinity_ppt', value: 35.0 },
                    ],
                    notes: 'Quick check',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getWaterLogs();

            expect(result).toEqual(mockLogs);
        });
    });

    describe('getWaterLogsByTank', () => {
        it('should filter logs by tankId', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.6 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-2',
                    testedAt: '2026-03-16T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.3 }],
                    notes: '',
                    createdAt: '2026-03-16T10:00:00Z',
                    updatedAt: '2026-03-16T10:00:00Z',
                },
                {
                    id: 'log-3',
                    tankId: 'tank-1',
                    testedAt: '2026-03-17T10:00:00Z',
                    readings: [{ parameterId: 'ph', value: 8.2 }],
                    notes: '',
                    createdAt: '2026-03-17T10:00:00Z',
                    updatedAt: '2026-03-17T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getWaterLogsByTank('tank-1');

            expect(result).toHaveLength(2);
            expect(result.every(log => log.tankId === 'tank-1')).toBe(true);
        });

        it('should return empty array when no logs match tankId', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.6 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getWaterLogsByTank('tank-999');

            expect(result).toEqual([]);
        });
    });

    describe('addWaterLog', () => {
        it('should generate ID and timestamps', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const now = new Date('2026-03-15T10:00:00Z');
            jest.useFakeTimers().setSystemTime(now);

            const result = await waterLogService.addWaterLog({
                tankId: 'tank-1',
                testedAt: now.toISOString(),
                readings: [
                    { parameterId: 'temperature', value: 25.7 },
                    { parameterId: 'salinity_ppt', value: 35.0 },
                ],
                notes: 'Quick test',
            });

            expect(result.id).toBe('test-uuid-123');
            expect(result.tankId).toBe('tank-1');
            expect(result.readings).toHaveLength(2);
            expect(result.createdAt).toBe(now.toISOString());
            expect(result.updatedAt).toBe(now.toISOString());

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_water_logs',
                expect.stringContaining('"tankId":"tank-1"')
            );

            jest.useRealTimers();
        });

        it('should add log to existing list', async () => {
            const existingLog: WaterLog = {
                id: 'existing-1',
                tankId: 'tank-1',
                testedAt: '2026-03-10T10:00:00Z',
                readings: [{ parameterId: 'temperature', value: 25.0 }],
                notes: '',
                createdAt: '2026-03-10T10:00:00Z',
                updatedAt: '2026-03-10T10:00:00Z',
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingLog]));

            await waterLogService.addWaterLog({
                tankId: 'tank-1',
                testedAt: new Date().toISOString(),
                readings: [{ parameterId: 'ph', value: 8.2 }],
                notes: '',
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_water_logs',
                expect.stringContaining('"id":"existing-1"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_water_logs',
                expect.stringContaining('"id":"test-uuid-123"')
            );
        });
    });

    describe('updateWaterLog', () => {
        it('should update fields and timestamp', async () => {
            const initialDate = new Date('2026-03-10T10:00:00Z');
            const updateDate = new Date('2026-03-15T10:00:00Z');

            const mockLog: WaterLog = {
                id: 'log-1',
                tankId: 'tank-1',
                testedAt: initialDate.toISOString(),
                readings: [{ parameterId: 'temperature', value: 25.6 }],
                notes: '',
                createdAt: initialDate.toISOString(),
                updatedAt: initialDate.toISOString(),
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([mockLog]));

            jest.useFakeTimers().setSystemTime(updateDate);

            const result = await waterLogService.updateWaterLog('log-1', { notes: 'Updated notes' });

            expect(result).not.toBeNull();
            expect(result!.notes).toBe('Updated notes');
            expect(result!.updatedAt).toBe(updateDate.toISOString());
            expect(result!.createdAt).toBe(initialDate.toISOString());

            jest.useRealTimers();
        });

        it('should return null for non-existent log', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await waterLogService.updateWaterLog('non-existent', { notes: 'Test' });

            expect(result).toBeNull();
        });
    });

    describe('deleteWaterLog', () => {
        it('should remove log from list', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-10T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.6 }],
                    notes: '',
                    createdAt: '2026-03-10T10:00:00Z',
                    updatedAt: '2026-03-10T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'ph', value: 8.2 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            await waterLogService.deleteWaterLog('log-1');

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_water_logs',
                expect.not.stringContaining('"id":"log-1"')
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@reef_keeper_water_logs',
                expect.stringContaining('"id":"log-2"')
            );
        });
    });

    describe('getLatestReadings', () => {
        it('should return most recent reading per parameter', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-10T10:00:00Z',
                    readings: [
                        { parameterId: 'temperature', value: 25.0 },
                        { parameterId: 'ph', value: 8.0 },
                    ],
                    notes: '',
                    createdAt: '2026-03-10T10:00:00Z',
                    updatedAt: '2026-03-10T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [
                        { parameterId: 'temperature', value: 25.7 },
                        { parameterId: 'calcium', value: 420 },
                    ],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getLatestReadings('tank-1');

            // Temperature should be from the newer log
            expect(result.get('temperature')).toEqual({ value: 25.7, testedAt: '2026-03-15T10:00:00Z' });
            // pH should be from the older log (only reading available)
            expect(result.get('ph')).toEqual({ value: 8.0, testedAt: '2026-03-10T10:00:00Z' });
            // Calcium from the newer log
            expect(result.get('calcium')).toEqual({ value: 420, testedAt: '2026-03-15T10:00:00Z' });
        });

        it('should only include readings from the specified tank', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.6 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-2',
                    testedAt: '2026-03-16T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 26.7 }],
                    notes: '',
                    createdAt: '2026-03-16T10:00:00Z',
                    updatedAt: '2026-03-16T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getLatestReadings('tank-1');

            expect(result.get('temperature')).toEqual({ value: 25.6, testedAt: '2026-03-15T10:00:00Z' });
        });

        it('should return empty map when no logs exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

            const result = await waterLogService.getLatestReadings('tank-1');

            expect(result.size).toBe(0);
        });
    });

    describe('getParameterHistory', () => {
        it('should return time series for a parameter', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-10T10:00:00Z',
                    readings: [
                        { parameterId: 'alkalinity', value: 8.0 },
                        { parameterId: 'calcium', value: 400 },
                    ],
                    notes: '',
                    createdAt: '2026-03-10T10:00:00Z',
                    updatedAt: '2026-03-10T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [
                        { parameterId: 'alkalinity', value: 8.5 },
                    ],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
                {
                    id: 'log-3',
                    tankId: 'tank-1',
                    testedAt: '2026-03-20T10:00:00Z',
                    readings: [
                        { parameterId: 'alkalinity', value: 9.0 },
                    ],
                    notes: '',
                    createdAt: '2026-03-20T10:00:00Z',
                    updatedAt: '2026-03-20T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getParameterHistory('tank-1', 'alkalinity');

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ date: '2026-03-10T10:00:00Z', value: 8.0 });
            expect(result[1]).toEqual({ date: '2026-03-15T10:00:00Z', value: 8.5 });
            expect(result[2]).toEqual({ date: '2026-03-20T10:00:00Z', value: 9.0 });
        });

        it('should respect day limit', async () => {
            jest.useFakeTimers().setSystemTime(new Date('2026-03-25T10:00:00Z'));

            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-02-15T10:00:00Z', // 38 days ago
                    readings: [{ parameterId: 'calcium', value: 400 }],
                    notes: '',
                    createdAt: '2026-02-15T10:00:00Z',
                    updatedAt: '2026-02-15T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-1',
                    testedAt: '2026-03-10T10:00:00Z', // 15 days ago
                    readings: [{ parameterId: 'calcium', value: 420 }],
                    notes: '',
                    createdAt: '2026-03-10T10:00:00Z',
                    updatedAt: '2026-03-10T10:00:00Z',
                },
                {
                    id: 'log-3',
                    tankId: 'tank-1',
                    testedAt: '2026-03-20T10:00:00Z', // 5 days ago
                    readings: [{ parameterId: 'calcium', value: 430 }],
                    notes: '',
                    createdAt: '2026-03-20T10:00:00Z',
                    updatedAt: '2026-03-20T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            // Default 30 days should exclude the first log (38 days ago)
            const result = await waterLogService.getParameterHistory('tank-1', 'calcium', 30);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ date: '2026-03-10T10:00:00Z', value: 420 });
            expect(result[1]).toEqual({ date: '2026-03-20T10:00:00Z', value: 430 });

            jest.useRealTimers();
        });

        it('should only include readings from specified tank', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'ph', value: 8.2 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
                {
                    id: 'log-2',
                    tankId: 'tank-2',
                    testedAt: '2026-03-16T10:00:00Z',
                    readings: [{ parameterId: 'ph', value: 8.4 }],
                    notes: '',
                    createdAt: '2026-03-16T10:00:00Z',
                    updatedAt: '2026-03-16T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getParameterHistory('tank-1', 'ph');

            expect(result).toHaveLength(1);
            expect(result[0].value).toBe(8.2);
        });

        it('should return empty array when no matching readings', async () => {
            const mockLogs: WaterLog[] = [
                {
                    id: 'log-1',
                    tankId: 'tank-1',
                    testedAt: '2026-03-15T10:00:00Z',
                    readings: [{ parameterId: 'temperature', value: 25.6 }],
                    notes: '',
                    createdAt: '2026-03-15T10:00:00Z',
                    updatedAt: '2026-03-15T10:00:00Z',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockLogs));

            const result = await waterLogService.getParameterHistory('tank-1', 'calcium');

            expect(result).toEqual([]);
        });
    });
});
