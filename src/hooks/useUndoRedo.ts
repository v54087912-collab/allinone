import { useCallback, useState } from 'react';
import { CropRect } from '../types/crop';

export interface UndoRedoState {
  past: CropRect[][];
  present: CropRect[];
  future: CropRect[][];
}

export function useUndoRedo(initialPresent: CropRect[] = []) {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState((curr) => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((curr) => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const setCropsWithHistory = useCallback((newPresentOrFn: CropRect[] | ((prev: CropRect[]) => CropRect[])) => {
    setState((curr) => {
      const nextPresent =
        typeof newPresentOrFn === 'function' ? newPresentOrFn(curr.present) : newPresentOrFn;

      // Don't register history if no changes
      if (JSON.stringify(curr.present) === JSON.stringify(nextPresent)) {
        return curr;
      }

      const MAX_HISTORY = 40;
      const newPast = [...curr.past, curr.present].slice(-MAX_HISTORY);

      return {
        past: newPast,
        present: nextPresent,
        future: [],
      };
    });
  }, []);

  // For lightweight live drag updates without flooding history stack
  const updateCropsWithoutHistory = useCallback((newPresentOrFn: CropRect[] | ((prev: CropRect[]) => CropRect[])) => {
    setState((curr) => {
      const nextPresent =
        typeof newPresentOrFn === 'function' ? newPresentOrFn(curr.present) : newPresentOrFn;
      return {
        ...curr,
        present: nextPresent,
      };
    });
  }, []);

  const resetHistory = useCallback((newPresent: CropRect[] = []) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return {
    crops: state.present,
    setCrops: setCropsWithHistory,
    setCropsWithoutHistory: updateCropsWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
