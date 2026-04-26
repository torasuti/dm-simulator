import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { DeckListPage } from './pages/DeckListPage';
import { DeckEditorPage } from './pages/DeckEditorPage';
import { GameBoardPage } from './pages/GameBoardPage';
import { LoginPage } from './pages/LoginPage';
import { SharedDeckPage } from './pages/SharedDeckPage';
import './index.css';

function getShareId(): string | null {
  const m = window.location.hash.match(/^#share=([a-z0-9]+)$/);
  return m ? m[1] : null;
}

function Router() {
  const { state } = useAppContext();
  if (state.page === 'game') return <GameBoardPage />;
  if (state.page === 'deckEditor') return <DeckEditorPage />;
  return <DeckListPage />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const shareId = getShareId();

  if (loading) return <div className="page"><p>読み込み中...</p></div>;
  if (shareId) return <SharedDeckPage shareId={shareId} />;
  if (!user) return <LoginPage />;
  return (
    <AppProvider>
      <GameProvider>
        <Router />
      </GameProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
