import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const EyeIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage({ onSwitchToRegister, onClose }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTestEmail, setForgotTestEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
    await login(email.trim().toLowerCase(), password);
    onClose?.();
  } catch (err) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
  };
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError('');
    setForgotMessage('');

    if (!forgotEmail.trim()) {
      setError('Enter your FAU email first.');
      return;
    }

    setForgotSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        email: forgotEmail.trim().toLowerCase(),
        testEmail: forgotTestEmail.trim().toLowerCase(),
      }),
      });

      const data = await response.json();

      setForgotMessage(data.message || 'If an account exists, a reset link has been sent.');
    } catch {
      setError('Could not request password reset.');
    } finally {
      setForgotSubmitting(false);
    }
  };
  return (
    <div className="auth-page" style={onClose ? { minHeight: 'auto' } : {}}>
      <div className="auth-card animate-fade-in" style={{ position: 'relative' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
            style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))' }}>
            🦉
          </div>
          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to your OwlNet account
          </p>
        </div>
        {error && (
          <div className="auth-error mb-4 animate-slide-down">
            {error}
          </div>
        )}

        {forgotMode ? (
          <>
            <form onSubmit={handleForgotPassword} id="forgot-password-form" noValidate>
              <div className="mb-4">
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  FAU Email
                </label>

                <input
                  id="forgot-email"
                  type="email"
                  placeholder="jdoe2025@fau.edu"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setError('');
                    setForgotMessage('');
                  }}
                  className="auth-input"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label
                  htmlFor="forgot-test-email"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Temporary personal email
                </label>

                <input
                  id="forgot-test-email"
                  type="email"
                  placeholder="Optional: personal email for local testing"
                  value={forgotTestEmail}
                  onChange={(e) => {
                    setForgotTestEmail(e.target.value);
                    setError('');
                    setForgotMessage('');
                  }}
                  className="auth-input"
                  autoComplete="email"
                />

                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Temporary testing only. FAU may block localhost reset links, so this sends a copy of the password reset email to a personal inbox. Remove before deployment.
                </p>
              </div>
            
              {forgotMessage && (
                <div
                  className="mb-4 animate-slide-down rounded-2xl px-4 py-3 text-sm font-semibold"
                  style={{
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    color: '#15803d',
                  }}
                >
                  {forgotMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))',
                  color: 'white',
                }}
              >
                {forgotSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError('');
                  setForgotMessage('');
                }}
                className="font-bold transition-colors hover:underline"
                style={{ color: 'var(--color-owl-blue-light)' }}
              >
                Back to Log In
              </button>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} id="login-form" noValidate>
              <div className="mb-4">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  FAU Email
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="jdoe2025@fau.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="auth-input"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="auth-input pr-10"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="text-right mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setForgotEmail(email);
                    setError('');
                    setForgotMessage('');
                  }}
                  className="text-xs font-bold hover:underline"
                  style={{ color: 'var(--color-owl-blue-light)' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))',
                  color: 'white',
                }}
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                id="switch-to-register"
                onClick={onSwitchToRegister}
                className="font-bold transition-colors hover:underline"
                style={{ color: 'var(--color-owl-blue-light)' }}
              >
                Sign Up
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
