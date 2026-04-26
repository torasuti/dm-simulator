import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/shared/Button';

export function LoginPage() {
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
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage('確認メールを送信しました。メールのリンクをクリックしてください。');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="page-title" style={{ marginBottom: 8 }}>デュエマ 一人回し</h1>
        <div className="tab-bar" style={{ marginBottom: 24 }}>
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>
            ログイン
          </button>
          <button className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>
            新規登録
          </button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-input"
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-input"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
          </Button>
        </form>
      </div>
    </div>
  );
}
