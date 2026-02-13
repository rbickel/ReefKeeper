import { createCreature, CREATURE_TYPE_LABELS, CREATURE_TYPE_ICONS, CreatureType } from '../../models/Creature';

describe('Creature', () => {
    describe('createCreature', () => {
        it('should create a creature with required fields', () => {
            const creature = createCreature({
                name: 'Nemo',
                species: 'Clownfish',
                type: 'fish',
            });

            expect(creature.name).toBe('Nemo');
            expect(creature.species).toBe('Clownfish');
            expect(creature.type).toBe('fish');
            expect(creature.id).toBe('');
            expect(creature.quantity).toBe(1);
            expect(creature.notes).toBe('');
            expect(creature.healthLog).toEqual([]);
            expect(creature.archived).toBe(false);
            expect(creature.createdAt).toBeDefined();
            expect(creature.updatedAt).toBeDefined();
        });

        it('should create a creature with optional fields', () => {
            const now = new Date().toISOString();
            const creature = createCreature({
                name: 'Coral',
                species: 'Brain Coral',
                type: 'coral',
                photoUri: 'https://example.com/photo.jpg',
                quantity: 3,
                notes: 'Test notes',
                archived: true,
                dateAcquired: now,
            });

            expect(creature.photoUri).toBe('https://example.com/photo.jpg');
            expect(creature.quantity).toBe(3);
            expect(creature.notes).toBe('Test notes');
            expect(creature.archived).toBe(true);
            expect(creature.dateAcquired).toBe(now);
        });

        it('should override default values with partial values', () => {
            const creature = createCreature({
                name: 'Shrimp',
                species: 'Cleaner Shrimp',
                type: 'invertebrate',
                quantity: 5,
            });

            expect(creature.quantity).toBe(5);
        });

        it('should set createdAt and updatedAt to current time', () => {
            const before = new Date().getTime();
            const creature = createCreature({
                name: 'Test',
                species: 'Test Species',
                type: 'other',
            });
            const after = new Date().getTime();

            const createdTime = new Date(creature.createdAt).getTime();
            const updatedTime = new Date(creature.updatedAt).getTime();

            expect(createdTime).toBeGreaterThanOrEqual(before);
            expect(createdTime).toBeLessThanOrEqual(after);
            expect(updatedTime).toBeGreaterThanOrEqual(before);
            expect(updatedTime).toBeLessThanOrEqual(after);
        });
    });

    describe('CREATURE_TYPE_LABELS', () => {
        it('should have labels for all creature types', () => {
            expect(CREATURE_TYPE_LABELS.fish).toBe('🐠 Fish');
            expect(CREATURE_TYPE_LABELS.coral).toBe('🪸 Coral');
            expect(CREATURE_TYPE_LABELS.invertebrate).toBe('🦀 Invertebrate');
            expect(CREATURE_TYPE_LABELS.other).toBe('🌊 Other');
        });

        it('should have labels for all CreatureType values', () => {
            const types: CreatureType[] = ['fish', 'coral', 'invertebrate', 'other'];
            types.forEach(type => {
                expect(CREATURE_TYPE_LABELS[type]).toBeDefined();
                expect(typeof CREATURE_TYPE_LABELS[type]).toBe('string');
            });
        });
    });

    describe('CREATURE_TYPE_ICONS', () => {
        it('should have icons for all creature types', () => {
            expect(CREATURE_TYPE_ICONS.fish).toBe('fish');
            expect(CREATURE_TYPE_ICONS.coral).toBe('flower');
            expect(CREATURE_TYPE_ICONS.invertebrate).toBe('spider');
            expect(CREATURE_TYPE_ICONS.other).toBe('waves');
        });

        it('should have icons for all CreatureType values', () => {
            const types: CreatureType[] = ['fish', 'coral', 'invertebrate', 'other'];
            types.forEach(type => {
                expect(CREATURE_TYPE_ICONS[type]).toBeDefined();
                expect(typeof CREATURE_TYPE_ICONS[type]).toBe('string');
            });
        });
    });
});
