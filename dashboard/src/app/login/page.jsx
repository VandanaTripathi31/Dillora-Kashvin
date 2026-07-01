'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/UI';

export default function LoginPage() {
  const router = useRouter();
  const { ready, isAuthed, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in → go to the dashboard
  useEffect(() => {
    if (ready && isAuthed) router.replace('/');
  }, [ready, isAuthed, router]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (res.ok) router.replace('/');
    else setErr(res.error || 'Login failed.');
  };

  return (
    <div className="adm__login">
      <form className="card adm__loginbox" onSubmit={submit}>
        <div className="adm__loginbrand">
          <Logo size={26} />
        </div>
        <h1 className="adm__logintitle">Admin sign in</h1>
        <p className="muted" style={{ marginBottom: 18 }}>Sign in to manage the Dillora store.</p>

        <label className="field field--2"><span>Email</span>
          <input type="email" autoComplete="username" value={email}
                 onChange={e => setEmail(e.target.value)} placeholder="admin@dillora.com" required />
        </label>
        <label className="field field--2" style={{ marginTop: 12 }}><span>Password</span>
          <input type="password" autoComplete="current-password" value={password}
                 onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>

        {err && <p className="opt__err" style={{ marginTop: 12 }}>{err}</p>}

        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={busy}>
          <LogIn className="w-[18px] h-[18px]" /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
