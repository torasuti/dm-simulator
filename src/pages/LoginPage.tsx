import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/shared/Button';

export function LoginPage() {
  const { dispatch } = useAppContext();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else dispatch({ type: 'NAVIGATE', page: 'deckList' });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage('確認メールを送信しました。メールのリンクをクリックしてください。');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="page-title" style={{ marginBottom: 8 }}>デュエマ 一人回し</h1>

        <button className="google-login-btn" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.705c-.18-.54-.282-1.117-.282-1.705s.102-1.165.282-1.705V4.963H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.037l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z"/></svg>
          Googleでログイン
        </button>

        <div className="login-divider"><span>または</span></div>

        <div className="tab-bar" style={{ marginBottom: 16 }}>
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>ログイン</button>
          <button className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>新規登録</button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} className="text-input" required autoComplete="email" />
          <input type="password" placeholder="パスワード（6文字以上）" value={password} onChange={(e) => setPassword(e.target.value)} className="text-input" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
          </Button>
        </form>

        <button className="login-guest-link" onClick={() => dispatch({ type: 'NAVIGATE', page: 'deckList' })}>
          ログインせずに使う（端末内のみ保存）
        </button>
      </div>
    </div>
  );
}
