import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FAU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@fau\.edu$/i;

export default function RegisterPage({ onSwitchToLogin, onClose }) {
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const validate = () => {
    const newErrors = {};

    if (!username.trim() || username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!FAU_EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Must be a valid @fau.edu email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError('');
    setSuccessMessage('');

    if (!validate()) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    setSubmitting(true);

    try {
      await register(cleanUsername, cleanEmail, password, testEmail);

      setSuccessMessage('Account created. Check your FAU email to verify your account before logging in.');

      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setServerError(err.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
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
            Join OwlNet
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Create your FAU student account
          </p>
        </div>

        {serverError && (
          <div className="auth-error mb-4 animate-slide-down">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="auth-success mb-4 animate-slide-down" role="status">
            <CheckCircle2 size={17} aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} id="register-form" noValidate>
          <div className="mb-4">
            <label htmlFor="register-username" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              Username
            </label>
            <input
              id="register-username"
              type="text"
              placeholder="OwlFan2025"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
              className={`auth-input ${errors.username ? 'auth-input-error' : ''}`}
              maxLength={30}
              autoComplete="username"
            />
            {errors.username && <p className="auth-field-error">{errors.username}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="register-email" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              FAU Email
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="jdoe2025@fau.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
              autoComplete="email"
            />
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label
              htmlFor="test-email"
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Temporary Personal Email
            </label>

            <input
              id="test-email"
              type="email"
              placeholder="Optional for local testing"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
            />

            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Optional: sends a copy of the verification link here for local testing.
            </p>
          </div>
          <div className="mb-4">
            <label htmlFor="register-password" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                className={`auth-input pr-10 ${errors.password ? 'auth-input-error' : ''}`}
                autoComplete="new-password"
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
            {errors.password && <p className="auth-field-error">{errors.password}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="register-confirm" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="register-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                className={`auth-input pr-10 ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
          </div>
          <button
            type="submit"
            id="register-submit-btn"
            disabled={submitting}
            className="auth-submit"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <button
            type="button"
            id="switch-to-login"
            onClick={onSwitchToLogin}
            className="font-bold transition-colors hover:underline"
            style={{ color: 'var(--color-owl-blue-light)' }}
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
