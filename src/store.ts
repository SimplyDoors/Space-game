import { create } from 'zustand';
import { Vector3 } from 'three';

export type EntityType = 'platform' | 'enemy' | 'barrel' | 'coin';

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector3;
  width: number;
  height: number;
  depth: number;
  active: boolean;
  velocity?: Vector3; // For coins
}

interface GameState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  isPlaying: boolean;
  speedMultiplier: number;
  entities: Entity[];
  
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  resetGame: () => void;
  
  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  clearEntities: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: parseInt(localStorage.getItem('highScore') || '0'),
  isGameOver: false,
  isPlaying: false,
  speedMultiplier: 1,
  entities: [],

  startGame: () => set({ isPlaying: true, isGameOver: false, score: 0, speedMultiplier: 1, entities: [] }),
  
  endGame: () => set((state) => {
    const newHighScore = Math.max(state.score, state.highScore);
    localStorage.setItem('highScore', newHighScore.toString());
    return { isGameOver: true, isPlaying: false, highScore: newHighScore };
  }),

  addScore: (points) => set((state) => {
    const newScore = state.score + points;
    const newMultiplier = 1 + Math.floor(newScore / 500) * 0.1;
    return { score: newScore, speedMultiplier: newMultiplier };
  }),

  resetGame: () => set({ isGameOver: false, isPlaying: false, score: 0, speedMultiplier: 1, entities: [] }),

  addEntity: (entity) => set((state) => ({ entities: [...state.entities, entity] })),
  
  removeEntity: (id) => set((state) => ({ entities: state.entities.filter(e => e.id !== id) })),
  
  updateEntity: (id, updates) => set((state) => ({
    entities: state.entities.map(e => e.id === id ? { ...e, ...updates } : e)
  })),

  clearEntities: () => set({ entities: [] }),
}));
