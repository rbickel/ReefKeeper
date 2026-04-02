import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tankService from './tankService';
import * as creatureService from './creatureService';
import * as taskService from './taskService';

const MIGRATION_VERSION_KEY = '@reef_keeper_migration_version';
const CURRENT_MIGRATION = 1;

export async function runMigrations(): Promise<void> {
    const currentVersion = parseInt(
        (await AsyncStorage.getItem(MIGRATION_VERSION_KEY)) || '0',
        10
    );

    if (currentVersion < 1) {
        await migrateToMultiTank();
        await AsyncStorage.setItem(MIGRATION_VERSION_KEY, '1');
    }
}

async function migrateToMultiTank(): Promise<void> {
    // 1. Check if a default tank already exists (idempotency)
    const existingTanks = await tankService.getTanks();
    let defaultTank = existingTanks.find((t) => t.isDefault);

    if (!defaultTank) {
        // Create the default tank
        defaultTank = await tankService.addTank({
            name: 'My Reef Tank',
            type: 'mixed-reef',
            volumeLiters: 284,
            salinityUnit: 'ppt',
            notes: 'Auto-created during upgrade. Edit to match your setup!',
            isDefault: true,
            photoUri: undefined,
        });
    }

    // 2. Assign all existing creatures to the default tank
    const creatures = await creatureService.getCreatures();
    for (const creature of creatures) {
        if (!creature.tankId) {
            await creatureService.updateCreature(creature.id, {
                tankId: defaultTank.id,
                careLevel: creature.careLevel || 'intermediate',
                compatibilityNotes: creature.compatibilityNotes || '',
            });
        }
    }

    // 3. Assign all existing tasks to the default tank
    const tasks = await taskService.getTasks();
    for (const task of tasks) {
        if (task.tankId === undefined || task.tankId === null) {
            await taskService.updateTask(task.id, {
                tankId: defaultTank.id,
                scope: 'tank',
            });
        }
    }

    // 4. Set default tank as active
    await tankService.setActiveTankId(defaultTank.id);
}

export async function getMigrationVersion(): Promise<number> {
    const version = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
    return parseInt(version || '0', 10);
}
