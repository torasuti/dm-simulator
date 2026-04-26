import { AppProvider, useAppContext } from './context/AppContext';
import { GameProvider } from './context/GameContext';
import { DeckListPage } from './pages/DeckListPage';
import { DeckEditorPage } from './pages/DeckEditorPage';
import { GameBoardPage } from './pages/GameBoardPage';
import './index.css';

function Router() {
  const { state } = useAppContext();
  if (state.page === 'game') return <GameBoardPage />;
  if (state.page === 'deckEditor') return <DeckEditorPage />;
  return <DeckListPage />;
}

export default function App() {
  return (
    <AppProvider>
      <GameProvider>
        <Router />
      </GameProvider>
    </AppProvider>
  );
}
