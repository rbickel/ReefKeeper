import { createTank, TANK_TYPE_LABELS, TankType, SalinityUnit } from '../../models/Tank';

describe('Tank', () => {
    describe('createTank', () => {
        it('should create a tank with required fields', () => {
            const tank = createTank({
                name: 'My Reef Tank',
                type: 'mixed-reef',
                volumeLiters: 284,
            });

            expect(tank.name).toBe('My Reef Tank');
            expect(tank.type).toBe('mixed-reef');
            expect(tank.volumeLiters).toBe(284);
            expect(tank.id).toBe('');
            expect(tank.salinityUnit).toBe('ppt');
            expect(tank.isDefault).toBe(false);
            expect(tank.notes).toBe('');
            expect(tank.totalSystemLiters).toBeUndefined();
            expect(tank.photoUri).toBeUndefined();
            expect(tank.createdAt).toBeDefined();
            expect(tank.updatedAt).toBeDefined();
        });

        it('should create a tank with optional fields', () => {
            const tank = createTank({
                name: 'Frag Tank',
                type: 'frag',
                volumeLiters: 151,
                totalSystemLiters: 208,
                salinityUnit: 'sg',
                photoUri: 'https://example.com/tank.jpg',
                notes: 'Propagation system',
                isDefault: true,
            });

            expect(tank.totalSystemLiters).toBe(208);
            expect(tank.salinityUnit).toBe('sg');
            expect(tank.photoUri).toBe('https://example.com/tank.jpg');
            expect(tank.notes).toBe('Propagation system');
            expect(tank.isDefault).toBe(true);
        });

        it('should default salinityUnit to ppt', () => {
            const tank = createTank({
                name: 'Test',
                type: 'nano',
                volumeLiters: 76,
            });

            expect(tank.salinityUnit).toBe('ppt');
        });

        it('should default isDefault to false', () => {
            const tank = createTank({
                name: 'Test',
                type: 'quarantine',
                volumeLiters: 38,
            });

            expect(tank.isDefault).toBe(false);
        });

        it('should set createdAt and updatedAt to current time', () => {
            const before = new Date().getTime();
            const tank = createTank({
                name: 'Test',
                type: 'mixed-reef',
                volumeLiters: 189,
            });
            const after = new Date().getTime();

            const createdTime = new Date(tank.createdAt).getTime();
            const updatedTime = new Date(tank.updatedAt).getTime();

            expect(createdTime).toBeGreaterThanOrEqual(before);
            expect(createdTime).toBeLessThanOrEqual(after);
            expect(updatedTime).toBeGreaterThanOrEqual(before);
            expect(updatedTime).toBeLessThanOrEqual(after);
        });

        it('should override default values with partial values', () => {
            const tank = createTank({
                name: 'Test',
                type: 'fowlr',
                volumeLiters: 378,
                salinityUnit: 'sg',
                isDefault: true,
                notes: 'Custom notes',
            });

            expect(tank.salinityUnit).toBe('sg');
            expect(tank.isDefault).toBe(true);
            expect(tank.notes).toBe('Custom notes');
        });

        it('should support both salinity units', () => {
            const units: SalinityUnit[] = ['ppt', 'sg'];

            units.forEach(unit => {
                const tank = createTank({
                    name: 'Test',
                    type: 'mixed-reef',
                    volumeLiters: 189,
                    salinityUnit: unit,
                });
                expect(tank.salinityUnit).toBe(unit);
            });
        });
    });

    describe('TANK_TYPE_LABELS', () => {
        it('should have labels for all 12 tank types', () => {
            const expectedTypes: TankType[] = [
                'mixed-reef',
                'sps-dominant',
                'lps-dominant',
                'soft-coral',
                'fowlr',
                'nano',
                'quarantine',
                'frag',
                'predator',
                'seahorse',
                'lagoon',
                'other',
            ];

            expect(Object.keys(TANK_TYPE_LABELS)).toHaveLength(12);

            expectedTypes.forEach(type => {
                expect(TANK_TYPE_LABELS[type]).toBeDefined();
                expect(typeof TANK_TYPE_LABELS[type]).toBe('string');
            });
        });

        it('should have correct label values', () => {
            expect(TANK_TYPE_LABELS['mixed-reef']).toBe('🪸 Mixed Reef');
            expect(TANK_TYPE_LABELS['sps-dominant']).toBe('🌿 SPS Dominant');
            expect(TANK_TYPE_LABELS['lps-dominant']).toBe('🫧 LPS Dominant');
            expect(TANK_TYPE_LABELS['soft-coral']).toBe('🍄 Soft Coral');
            expect(TANK_TYPE_LABELS['fowlr']).toBe('🐟 FOWLR');
            expect(TANK_TYPE_LABELS['nano']).toBe('🔬 Nano Reef');
            expect(TANK_TYPE_LABELS['quarantine']).toBe('🏥 Quarantine');
            expect(TANK_TYPE_LABELS['frag']).toBe('✂️ Frag Tank');
            expect(TANK_TYPE_LABELS['predator']).toBe('🦈 Predator');
            expect(TANK_TYPE_LABELS['seahorse']).toBe('🐴 Seahorse');
            expect(TANK_TYPE_LABELS['lagoon']).toBe('🏖️ Lagoon');
            expect(TANK_TYPE_LABELS['other']).toBe('🌊 Other');
        });

        it('should have all TankType values as keys', () => {
            const types: TankType[] = [
                'mixed-reef', 'sps-dominant', 'lps-dominant', 'soft-coral',
                'fowlr', 'nano', 'quarantine', 'frag',
                'predator', 'seahorse', 'lagoon', 'other',
            ];
            types.forEach(type => {
                expect(TANK_TYPE_LABELS[type]).toBeDefined();
            });
        });
    });
});
