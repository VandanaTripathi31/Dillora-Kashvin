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
    <div className="flex min-h-screen items-center justify-center p-6"
         style={{ background: 'radial-gradient(1200px 600px at 20% -10%, rgba(166,79,214,.14), transparent 60%), radial-gradient(1000px 500px at 100% 110%, rgba(122,79,240,.14), transparent 60%), #fdfbf7' }}>
      <form className="card w-full max-w-[400px] px-7 py-[30px]" onSubmit={submit}>
        <div className="mb-3.5 flex justify-center">
          <Logo size={26} />
        </div>
        <h1 className="mb-0.5 font-display text-[1.5rem] font-bold text-ink">Admin sign in</h1>
        <p className="muted mb-[18px]">Sign in to manage the Dillora store.</p>

        <label className="field field--2"><span>Email</span>
          <input type="email" autoComplete="username" value={email}
                 onChange={e => setEmail(e.target.value)} placeholder="admin@dillora.com" required />
        </label>
        <label className="field field--2 mt-3"><span>Password</span>
          <input type="password" autoComplete="current-password" value={password}
                 onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>

        {err && <p className="opt__err mt-3">{err}</p>}

        <button className="btn btn-primary btn-block mt-[18px]" disabled={busy}>
          <LogIn className="h-[18px] w-[18px]" /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
