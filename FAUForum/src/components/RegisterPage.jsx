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

const FAU_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@fau\.edu$/i;

export default function RegisterPage({ onSwitchToLogin }) {
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

    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
      // Success - AuthContext sets user, App.jsx will redirect
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
            style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))' }}>
            🦉
          </div>
          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Join OwlNet
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Create your FAU student account
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="auth-error mb-4 animate-slide-down">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} id="register-form" noValidate>
          {/* Username */}
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

          {/* Email */}
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
            {!errors.email && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Must end with @fau.edu
              </p>
            )}
          </div>

          {/* Password */}
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
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p className="auth-field-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
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
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))', color: 'white' }}
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Switch to Login */}
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
