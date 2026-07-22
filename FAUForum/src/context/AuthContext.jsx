import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const FAU_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@fau\.edu$/i;

// Default avatar from DiceBear
const generateDefaultAvatar = (seed) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('owlnet_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsLoggedIn(true);
      }
    } catch {
      localStorage.removeItem('owlnet_session');
    }
    setLoading(false);
  }, []);

  // Persist session changes
  const persistSession = useCallback((userData) => {
    if (userData) {
      localStorage.setItem('owlnet_session', JSON.stringify(userData));
    } else {
      localStorage.removeItem('owlnet_session');
    }
  }, []);

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    // Validate email format
    if (!FAU_EMAIL_REGEX.test(email)) {
      throw new Error('Email must be a valid @fau.edu address.');
    }

    // Validate username length
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }

    // Validate password length
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    // Call backend API
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    // Set session
    const userData = {
      id: data.id,
      username: data.username,
      email: data.email,
      avatar: data.avatar || generateDefaultAvatar(data.username),
      bio: data.bio || '',
      joinDate: data.created_at || new Date().toISOString(),
    };

    setUser(userData);
    setIsLoggedIn(true);
    persistSession(userData);

    return userData;
  }, [persistSession]);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password.');
    }

    const userData = {
      id: data.id,
      username: data.username,
      email: data.email,
      avatar: data.avatar || generateDefaultAvatar(data.username),
      bio: data.bio || '',
      joinDate: data.created_at || new Date().toISOString(),
    };

    setUser(userData);
    setIsLoggedIn(true);
    persistSession(userData);

    return userData;
  }, [persistSession]);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    persistSession(null);
  }, [persistSession]);

  // ── Update Profile ────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('Not logged in.');

    const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    const updatedUser = {
      ...user,
      username: data.username || user.username,
      bio: data.bio ?? user.bio,
      avatar: data.avatar || user.avatar,
    };

    setUser(updatedUser);
    persistSession(updatedUser);

    return updatedUser;
  }, [user, persistSession]);

  // ── Context Value ─────────────────────────────────────────
  const value = {
    user,
    isLoggedIn,
    loading,
    register,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
