import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSwitchToRegister, onClose }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
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
            <X size={18} aria-hidden="true" />
          </button>
        )}
        <div className="text-center mb-8">
          <img
            src="/fau-owl-logo.png"
            alt="OwlNet"
            className="mx-auto mb-4 h-16 w-16 object-contain"
          />
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
              
              {forgotMessage && (
                <div className="auth-success mb-4 animate-slide-down" role="status">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>{forgotMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={forgotSubmitting}
                className="auth-submit"
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
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
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
                className="auth-submit"
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
