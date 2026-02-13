import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCreatures } from '../../hooks/useCreatures';
import * as creatureService from '../../services/creatureService';
import { DEFAULT_CREATURES } from '../../constants/DefaultCreatures';

// Mock the creature service
jest.mock('../../services/creatureService', () => ({
    getCreatures: jest.fn(),
    addCreature: jest.fn(),
    updateCreature: jest.fn(),
    archiveCreature: jest.fn(),
    deleteCreature: jest.fn(),
    isInitialized: jest.fn(),
    markInitialized: jest.fn(),
}));

// Mock DEFAULT_CREATURES
jest.mock('../../constants/DefaultCreatures', () => ({
    DEFAULT_CREATURES: [
        {
            name: 'Default Fish',
            species: 'Test Species',
            type: 'fish',
            quantity: 1,
            notes: '',
        },
    ],
}));

describe('useCreatures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (creatureService.getCreatures as jest.Mock).mockResolvedValue([]);
        (creatureService.isInitialized as jest.Mock).mockResolvedValue(true);
    });

    it('should initialize with empty creatures and loading state', () => {
        const { result } = renderHook(() => useCreatures());

        expect(result.current.creatures).toEqual([]);
        expect(result.current.loading).toBe(true);
    });

    it('should load creatures on mount', async () => {
        const mockCreatures = [
            {
                id: '1',
                name: 'Nemo',
                species: 'Clownfish',
                type: 'fish' as const,
                dateAcquired: '2026-01-01',
                quantity: 1,
                notes: '',
                healthLog: [],
                archived: false,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
        ];
        (creatureService.getCreatures as jest.Mock).mockResolvedValue(mockCreatures);

        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.creatures).toEqual(mockCreatures);
        expect(creatureService.getCreatures).toHaveBeenCalled();
    });

    it('should filter out archived creatures', async () => {
        const mockCreatures = [
            {
                id: '1',
                name: 'Active',
                species: 'Species1',
                type: 'fish' as const,
                dateAcquired: '2026-01-01',
                quantity: 1,
                notes: '',
                healthLog: [],
                archived: false,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
            {
                id: '2',
                name: 'Archived',
                species: 'Species2',
                type: 'fish' as const,
                dateAcquired: '2026-01-01',
                quantity: 1,
                notes: '',
                healthLog: [],
                archived: true,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
        ];
        (creatureService.getCreatures as jest.Mock).mockResolvedValue(mockCreatures);

        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.creatures).toHaveLength(1);
        expect(result.current.creatures[0].name).toBe('Active');
    });

    it('should initialize default creatures when not initialized', async () => {
        (creatureService.isInitialized as jest.Mock).mockResolvedValue(false);
        (creatureService.addCreature as jest.Mock).mockImplementation((creature) =>
            Promise.resolve({ ...creature, id: 'new-id' })
        );

        renderHook(() => useCreatures());

        await waitFor(() => {
            expect(creatureService.addCreature).toHaveBeenCalled();
        });

        expect(creatureService.markInitialized).toHaveBeenCalled();
    });

    it('should not initialize defaults when already initialized', async () => {
        (creatureService.isInitialized as jest.Mock).mockResolvedValue(true);

        renderHook(() => useCreatures());

        await waitFor(() => {
            expect(creatureService.getCreatures).toHaveBeenCalled();
        });

        expect(creatureService.addCreature).not.toHaveBeenCalled();
        expect(creatureService.markInitialized).not.toHaveBeenCalled();
    });

    it('should add a new creature', async () => {
        const mockCreature = {
            name: 'New Fish',
            species: 'New Species',
            type: 'fish' as const,
            dateAcquired: '2026-01-01',
            quantity: 1,
            notes: '',
        };

        const addedCreature = {
            ...mockCreature,
            id: 'new-id',
            healthLog: [],
            archived: false,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        };

        (creatureService.addCreature as jest.Mock).mockResolvedValue(addedCreature);
        (creatureService.getCreatures as jest.Mock).mockResolvedValue([addedCreature]);

        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.add(mockCreature);
        });

        expect(creatureService.addCreature).toHaveBeenCalledWith(mockCreature);
        expect(creatureService.getCreatures).toHaveBeenCalled();
    });

    it('should update a creature', async () => {
        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.update('creature-id', { name: 'Updated Name' });
        });

        expect(creatureService.updateCreature).toHaveBeenCalledWith('creature-id', { name: 'Updated Name' });
        expect(creatureService.getCreatures).toHaveBeenCalled();
    });

    it('should archive a creature', async () => {
        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.archive('creature-id');
        });

        expect(creatureService.archiveCreature).toHaveBeenCalledWith('creature-id');
        expect(creatureService.getCreatures).toHaveBeenCalled();
    });

    it('should remove a creature', async () => {
        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.remove('creature-id');
        });

        expect(creatureService.deleteCreature).toHaveBeenCalledWith('creature-id');
        expect(creatureService.getCreatures).toHaveBeenCalled();
    });

    it('should refresh creatures', async () => {
        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const initialCallCount = (creatureService.getCreatures as jest.Mock).mock.calls.length;

        await act(async () => {
            await result.current.refresh();
        });

        expect((creatureService.getCreatures as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should handle errors when loading creatures', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        (creatureService.getCreatures as jest.Mock).mockRejectedValue(new Error('Load failed'));

        const { result } = renderHook(() => useCreatures());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(consoleError).toHaveBeenCalledWith('Failed to load creatures:', expect.any(Error));
        consoleError.mockRestore();
    });
});
