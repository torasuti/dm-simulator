import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, AppPage } from '../types';

type AppAction =
  | { type: 'NAVIGATE'; page: AppPage }
  | { type: 'SELECT_DECK'; deckId: string }
  | { type: 'EDIT_DECK'; deckId: string | null };

const initialState: AppState = {
  page: 'deckList',
  selectedDeckId: null,
  editingDeckId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, page: action.page };
    case 'SELECT_DECK':
      return { ...state, selectedDeckId: action.deckId, page: 'game' };
    case 'EDIT_DECK':
      return { ...state, editingDeckId: action.deckId, page: 'deckEditor' };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
