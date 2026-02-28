import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

const Auth = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { signUp, logIn, logInWithGoogle, logInWithGithub, isAuthenticated, triggerSplash } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, show cinematic splash then redirect to dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      triggerSplash();
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, triggerSplash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const identifier = email.trim();
        if (!identifier || !password) {
          setError('Please enter both email/username and password.');
          setLoading(false);
          return;
        }
        await logIn({ identifier, password });
      } else {
        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
          setError('Please choose a username.');
          setLoading(false);
          return;
        }
        if (!trimmedEmail) {
          setError('Email is required.');
          setLoading(false);
          return;
        }
        // Basic email format validation to guard obvious mistakes.
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (!fullName.trim()) {
          setError('Please choose a username.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await signUp({ email: trimmedEmail, password, fullName: trimmedName });
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await logInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Auth failed');
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await logInWithGithub();
    } catch (err) {
      setError(err.message || 'GitHub Auth failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-gradient)' }}>
      <div className="glass-panel glow-border" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <BrandLogo size="md" />
        </div>

        <h1 style={{ marginBottom: '0.5rem' }}>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p style={{ marginBottom: '1.75rem' }} className="muted">
          {isLogin ? 'Sign in to continue in Local Mode' : 'Start building macros securely in Local Mode'}
        </p>

        <form className="flex-col" style={{ gap: '1rem' }} onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <User size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Username"
                onChange={(e) => setFullName(e.target.value)}
                style={{ background: 'transparent', border: 'none', width: '100%', color: 'var(--text-primary)', outline: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          )}
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Mail size={18} color="var(--text-muted)" />
            <input
              type="email"
              placeholder={isLogin ? 'Email or Username' : 'Email'}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'transparent', border: 'none', width: '100%', color: 'var(--text-primary)', outline: 'none', boxShadow: 'none' }}
              required
            />
          </div>
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Lock size={18} color="var(--text-muted)" />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: 'transparent', border: 'none', width: '100%', color: 'var(--text-primary)', outline: 'none', boxShadow: 'none' }}
              required
            />
          </div>
          {!isLogin && (
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Lock size={18} color="var(--text-muted)" />
              <input
                type="password"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ background: 'transparent', border: 'none', width: '100%', color: 'var(--text-primary)', outline: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          )}
          {!isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I agree to the Terms & Privacy</label>
            </div>
          )}
          {isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
          )}
          {error && (
            <div style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        {isLogin && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Or continue with</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Continue with GitHub
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/signup' : '/login'} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
            {isLogin ? 'Create an account' : 'Log in'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
