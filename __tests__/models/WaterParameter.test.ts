import {
    WATER_PARAMETERS,
    getParameterStatus,
    WaterParameterId,
    WaterParameterDefinition,
} from '../../models/WaterParameter';

describe('WaterParameter', () => {
    describe('WATER_PARAMETERS', () => {
        it('should have all 11 parameters', () => {
            expect(WATER_PARAMETERS).toHaveLength(11);
        });

        it('should have all expected parameter IDs', () => {
            const expectedIds: WaterParameterId[] = [
                'temperature',
                'salinity_ppt',
                'salinity_sg',
                'ph',
                'ammonia',
                'nitrite',
                'nitrate',
                'phosphate',
                'calcium',
                'alkalinity',
                'magnesium',
            ];

            const actualIds = WATER_PARAMETERS.map(p => p.id);
            expectedIds.forEach(id => {
                expect(actualIds).toContain(id);
            });
        });

        it('should have valid ranges for each parameter', () => {
            WATER_PARAMETERS.forEach(param => {
                expect(param.ranges.reefLow).toBeDefined();
                expect(param.ranges.reefHigh).toBeDefined();
                expect(param.ranges.reefHigh).toBeGreaterThanOrEqual(param.ranges.reefLow);

                // criticalHigh should be >= reefHigh when defined
                if (param.ranges.criticalHigh !== null) {
                    expect(param.ranges.criticalHigh).toBeGreaterThanOrEqual(param.ranges.reefHigh);
                }

                // criticalLow should be <= reefLow when defined
                if (param.ranges.criticalLow !== null) {
                    expect(param.ranges.criticalLow).toBeLessThanOrEqual(param.ranges.reefLow);
                }
            });
        });

        it('should have required fields for each parameter', () => {
            WATER_PARAMETERS.forEach(param => {
                expect(param.id).toBeDefined();
                expect(param.label).toBeDefined();
                expect(typeof param.label).toBe('string');
                expect(param.unit).toBeDefined();
                expect(param.emoji).toBeDefined();
                expect(param.ranges).toBeDefined();
                expect(typeof param.decimalPlaces).toBe('number');
                expect(param.decimalPlaces).toBeGreaterThanOrEqual(0);
            });
        });

        it('should have null criticalLow for ammonia, nitrite, nitrate, and phosphate', () => {
            const nullLowParams = ['ammonia', 'nitrite', 'nitrate', 'phosphate'];
            nullLowParams.forEach(id => {
                const param = WATER_PARAMETERS.find(p => p.id === id);
                expect(param).toBeDefined();
                expect(param!.ranges.criticalLow).toBeNull();
            });
        });

        it('should have non-null criticalLow for temperature, salinity, pH, calcium, alkalinity, magnesium', () => {
            const nonNullLowParams = [
                'temperature', 'salinity_ppt', 'salinity_sg', 'ph',
                'calcium', 'alkalinity', 'magnesium',
            ];
            nonNullLowParams.forEach(id => {
                const param = WATER_PARAMETERS.find(p => p.id === id);
                expect(param).toBeDefined();
                expect(param!.ranges.criticalLow).not.toBeNull();
            });
        });

        it('should have correct ranges for temperature', () => {
            const temp = WATER_PARAMETERS.find(p => p.id === 'temperature')!;
            expect(temp.ranges.reefLow).toBe(24.4);
            expect(temp.ranges.reefHigh).toBe(26.7);
            expect(temp.ranges.criticalLow).toBe(23.3);
            expect(temp.ranges.criticalHigh).toBe(27.8);
        });

        it('should have correct ranges for calcium', () => {
            const calcium = WATER_PARAMETERS.find(p => p.id === 'calcium')!;
            expect(calcium.ranges.reefLow).toBe(380);
            expect(calcium.ranges.reefHigh).toBe(450);
            expect(calcium.ranges.criticalLow).toBe(350);
            expect(calcium.ranges.criticalHigh).toBe(500);
        });
    });

    describe('getParameterStatus', () => {
        it('should return "ok" for values within reef range', () => {
            expect(getParameterStatus('temperature', 25.6)).toBe('ok');
            expect(getParameterStatus('salinity_ppt', 35.0)).toBe('ok');
            expect(getParameterStatus('ph', 8.2)).toBe('ok');
            expect(getParameterStatus('calcium', 420)).toBe('ok');
            expect(getParameterStatus('alkalinity', 9.0)).toBe('ok');
            expect(getParameterStatus('magnesium', 1350)).toBe('ok');
            expect(getParameterStatus('ammonia', 0.0)).toBe('ok');
            expect(getParameterStatus('nitrate', 5.0)).toBe('ok');
            expect(getParameterStatus('phosphate', 0.03)).toBe('ok');
        });

        it('should return "warning" for values outside reef range but not critical', () => {
            // Temperature above reef high but below critical high
            expect(getParameterStatus('temperature', 27.2)).toBe('warning');
            // Temperature below reef low but above critical low
            expect(getParameterStatus('temperature', 23.9)).toBe('warning');
            // Calcium above reef high but below critical high
            expect(getParameterStatus('calcium', 470)).toBe('warning');
            // Alkalinity below reef low but above critical low
            expect(getParameterStatus('alkalinity', 6.5)).toBe('warning');
            // Nitrate above reef high but below critical high
            expect(getParameterStatus('nitrate', 15.0)).toBe('warning');
        });

        it('should return "critical" for values beyond critical thresholds', () => {
            // Temperature above critical high
            expect(getParameterStatus('temperature', 28.3)).toBe('critical');
            // Temperature below critical low
            expect(getParameterStatus('temperature', 22.8)).toBe('critical');
            // Calcium above critical high
            expect(getParameterStatus('calcium', 510)).toBe('critical');
            // Calcium below critical low
            expect(getParameterStatus('calcium', 340)).toBe('critical');
            // Ammonia above critical high
            expect(getParameterStatus('ammonia', 0.3)).toBe('critical');
        });

        it('should return "ok" for values at exact reef range boundaries', () => {
            // Exact reef low
            expect(getParameterStatus('temperature', 24.4)).toBe('ok');
            // Exact reef high
            expect(getParameterStatus('temperature', 26.7)).toBe('ok');
            // Exact reef low for calcium
            expect(getParameterStatus('calcium', 380)).toBe('ok');
            // Exact reef high for calcium
            expect(getParameterStatus('calcium', 450)).toBe('ok');
        });

        it('should return "warning" (not critical) at exact critical boundaries', () => {
            // At exactly critical low — the condition is value < criticalLow, so exact shouldn't be critical
            expect(getParameterStatus('temperature', 23.3)).toBe('warning');
            // At exactly critical high — the condition is value > criticalHigh, so exact shouldn't be critical
            expect(getParameterStatus('temperature', 27.8)).toBe('warning');
        });

        it('should handle parameters with null criticalLow correctly', () => {
            // Ammonia: criticalLow is null, reefLow is 0, reefHigh is 0
            // Any ammonia > 0 but <= criticalHigh (0.25) is warning
            expect(getParameterStatus('ammonia', 0.1)).toBe('warning');
            // Above criticalHigh is critical
            expect(getParameterStatus('ammonia', 0.3)).toBe('critical');
            // At 0 is ok (within reef range)
            expect(getParameterStatus('ammonia', 0.0)).toBe('ok');
        });

        it('should return "ok" for unknown parameter ID', () => {
            expect(getParameterStatus('unknown_param' as WaterParameterId, 42)).toBe('ok');
        });

        it('should handle salinity SG ranges correctly', () => {
            expect(getParameterStatus('salinity_sg', 1.025)).toBe('ok');
            expect(getParameterStatus('salinity_sg', 1.027)).toBe('warning');
            expect(getParameterStatus('salinity_sg', 1.023)).toBe('warning');
            expect(getParameterStatus('salinity_sg', 1.029)).toBe('critical');
            expect(getParameterStatus('salinity_sg', 1.021)).toBe('critical');
        });

        it('should handle phosphate ranges correctly', () => {
            expect(getParameterStatus('phosphate', 0.03)).toBe('ok');
            expect(getParameterStatus('phosphate', 0.07)).toBe('warning');
            expect(getParameterStatus('phosphate', 0.15)).toBe('critical');
        });
    });
});
