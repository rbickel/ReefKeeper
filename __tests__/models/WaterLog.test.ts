import { createWaterLog } from '../../models/WaterLog';
import { WaterParameterId } from '../../models/WaterParameter';

describe('WaterLog', () => {
    describe('createWaterLog', () => {
        it('should create a water log with required fields', () => {
            const readings = [
                { parameterId: 'temperature' as WaterParameterId, value: 78.2 },
                { parameterId: 'salinity_ppt' as WaterParameterId, value: 35.0 },
            ];

            const log = createWaterLog({
                tankId: 'tank-1',
                readings,
            });

            expect(log.tankId).toBe('tank-1');
            expect(log.readings).toEqual(readings);
            expect(log.id).toBe('');
            expect(log.notes).toBe('');
            expect(log.testedAt).toBeDefined();
            expect(log.createdAt).toBeDefined();
            expect(log.updatedAt).toBeDefined();
        });

        it('should default notes to empty string', () => {
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [{ parameterId: 'ph' as WaterParameterId, value: 8.2 }],
            });

            expect(log.notes).toBe('');
        });

        it('should set testedAt to current time by default', () => {
            const before = new Date().getTime();
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [{ parameterId: 'calcium' as WaterParameterId, value: 420 }],
            });
            const after = new Date().getTime();

            const testedAtTime = new Date(log.testedAt).getTime();
            expect(testedAtTime).toBeGreaterThanOrEqual(before);
            expect(testedAtTime).toBeLessThanOrEqual(after);
        });

        it('should set createdAt and updatedAt to current time', () => {
            const before = new Date().getTime();
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [{ parameterId: 'alkalinity' as WaterParameterId, value: 8.5 }],
            });
            const after = new Date().getTime();

            const createdTime = new Date(log.createdAt).getTime();
            const updatedTime = new Date(log.updatedAt).getTime();

            expect(createdTime).toBeGreaterThanOrEqual(before);
            expect(createdTime).toBeLessThanOrEqual(after);
            expect(updatedTime).toBeGreaterThanOrEqual(before);
            expect(updatedTime).toBeLessThanOrEqual(after);
        });

        it('should allow override of optional fields', () => {
            const customDate = '2026-03-15T10:00:00.000Z';
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [{ parameterId: 'magnesium' as WaterParameterId, value: 1350 }],
                testedAt: customDate,
                notes: 'Full panel test',
            });

            expect(log.testedAt).toBe(customDate);
            expect(log.notes).toBe('Full panel test');
        });

        it('should support sparse readings with a single parameter', () => {
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [{ parameterId: 'temperature' as WaterParameterId, value: 78.0 }],
            });

            expect(log.readings).toHaveLength(1);
            expect(log.readings[0].parameterId).toBe('temperature');
            expect(log.readings[0].value).toBe(78.0);
        });

        it('should support full panel readings with all 11 parameters', () => {
            const fullReadings = [
                { parameterId: 'temperature' as WaterParameterId, value: 78.2 },
                { parameterId: 'salinity_ppt' as WaterParameterId, value: 35.0 },
                { parameterId: 'salinity_sg' as WaterParameterId, value: 1.025 },
                { parameterId: 'ph' as WaterParameterId, value: 8.21 },
                { parameterId: 'ammonia' as WaterParameterId, value: 0.0 },
                { parameterId: 'nitrite' as WaterParameterId, value: 0.0 },
                { parameterId: 'nitrate' as WaterParameterId, value: 4.0 },
                { parameterId: 'phosphate' as WaterParameterId, value: 0.03 },
                { parameterId: 'calcium' as WaterParameterId, value: 420 },
                { parameterId: 'alkalinity' as WaterParameterId, value: 8.5 },
                { parameterId: 'magnesium' as WaterParameterId, value: 1350 },
            ];

            const log = createWaterLog({
                tankId: 'tank-1',
                readings: fullReadings,
            });

            expect(log.readings).toHaveLength(11);
        });

        it('should support empty readings array', () => {
            const log = createWaterLog({
                tankId: 'tank-1',
                readings: [],
            });

            expect(log.readings).toEqual([]);
        });
    });
});
