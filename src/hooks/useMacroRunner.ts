import { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import type { Macro, MacroAction } from '../types';

export function useMacroRunner() {
  const { state, dispatch } = useGameContext();
  const remainingRef = useRef<MacroAction[]>([]);

  const executeSteps = useCallback(
    (steps: MacroAction[]) => {
      let i = 0;
      while (i < steps.length) {
        const step = steps[i];

        if (step.type === 'MOVE_TOP_TO_ZONE') {
          dispatch({ type: 'MOVE_TOP_TO_ZONE', n: step.n, from: 'deck', to: step.destination });
          i++;
        } else if (step.type === 'REVEAL_AND_SELECT') {
          const remaining = steps.slice(i + 1);
          remainingRef.current = remaining;
          dispatch({ type: 'MOVE_TOP_TO_ZONE', n: step.n, from: 'deck', to: 'displayZone' });
          const cards = state.board.deck.slice(0, step.n);
          dispatch({ type: 'BEGIN_REVEAL', cards, destinations: step.destinations, remainingSteps: remaining });
          return;
        } else if (step.type === 'PICK_FROM_ZONE') {
          const remaining = steps.slice(i + 1);
          remainingRef.current = remaining;
          dispatch({
            type: 'BEGIN_PICK',
            sources: step.sources,
            destination: step.destination,
            maxCount: step.count,
            remainingSteps: remaining,
          });
          return;
        } else if (step.type === 'PICK_FROM_ZONE_LOOP') {
          const remaining = steps.slice(i + 1);
          remainingRef.current = remaining;
          dispatch({
            type: 'BEGIN_PICK',
            sources: step.sources,
            destination: step.destination,
            maxCount: null,
            remainingSteps: remaining,
          });
          return;
        } else if (step.type === 'SHUFFLE') {
          dispatch({ type: 'SHUFFLE_ZONE', zoneId: step.zoneId });
          i++;
        } else if (step.type === 'GR_SUMMON_MACRO') {
          dispatch({ type: 'GR_SUMMON' });
          i++;
        } else if (step.type === 'MULTI_EVOLVE') {
          const remaining = steps.slice(i + 1);
          remainingRef.current = remaining;
          dispatch({
            type: 'BEGIN_MULTI_EVOLVE',
            evolutionSources: step.evolutionSources,
            baseSources: step.baseSources,
            destination: step.destination,
            baseCount: step.baseCount,
            remainingSteps: remaining,
          });
          return;
        } else if (step.type === 'MULTI_EVOLVE_LOOP') {
          const remaining = steps.slice(i + 1);
          remainingRef.current = remaining;
          dispatch({
            type: 'BEGIN_MULTI_EVOLVE',
            evolutionSources: step.evolutionSources,
            baseSources: step.baseSources,
            destination: step.destination,
            baseCount: null,
            remainingSteps: remaining,
          });
          return;
        }
      }
      remainingRef.current = [];
    },
    [dispatch, state.board.deck]
  );

  useEffect(() => {
    if (state.pendingReveal === null && state.pendingPick === null && state.pendingEvolve === null && state.pendingMultiEvolve === null && remainingRef.current.length > 0) {
      const steps = remainingRef.current;
      remainingRef.current = [];
      executeSteps(steps);
    }
  }, [state.pendingReveal, state.pendingPick, state.pendingEvolve, state.pendingMultiEvolve, executeSteps]);

  const runMacro = useCallback(
    (macro: Macro) => {
      executeSteps(macro.steps);
    },
    [executeSteps]
  );

  return { runMacro };
}
