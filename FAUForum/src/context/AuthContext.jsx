import { createContext, useContext, useState, useCallback } from 'react';
import { getAvatarOrDefault } from '../utils/avatar';

const AuthContext = createContext(null);

const FAU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@fau\.edu$/i;

function readSavedSession() {
  try {
    const savedSession = localStorage.getItem('owlnet_session');
    const user = savedSession ? JSON.parse(savedSession) : null;

    return user
      ? {
          ...user,
          avatar: getAvatarOrDefault(user.avatar),
        }
      : null;
  } catch {
    try {
      localStorage.removeItem('owlnet_session');
    } catch {
      // The app can still run when browser storage is unavailable.
    }
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedSession);
  const isLoggedIn = Boolean(user);
  const loading = false;

  const persistSession = useCallback((userData) => {
    try {
      if (userData) {
        localStorage.setItem('owlnet_session', JSON.stringify(userData));
      } else {
        localStorage.removeItem('owlnet_session');
      }
    } catch {
      // Keep the in-memory session usable when storage is blocked.
    }
  }, []);
  const register = useCallback(async (username, email, password, testEmail = '') => {
    if (!FAU_EMAIL_REGEX.test(email)) {
      throw new Error('Email must be a valid @fau.edu address.');
    }
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        testEmail: testEmail.trim().toLowerCase(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    const userData = {
      id: data.id,
      username: data.username,
      email: data.email,
      avatar: getAvatarOrDefault(data.avatar),
      bio: data.bio || '',
      banner_color: data.banner_color || '',
      banner_image: data.banner_image || '',
      joinDate: data.created_at || new Date().toISOString(),
    };

    return userData;
  }, []);
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
      avatar: getAvatarOrDefault(data.avatar),
      bio: data.bio || '',
      banner_color: data.banner_color || '',
      banner_image: data.banner_image || '',
      joinDate: data.created_at || new Date().toISOString(),
      is_admin: data.is_admin,
      isAdmin: data.isAdmin || data.is_admin === 1,
    };

    setUser(userData);
    persistSession(userData);

    return userData;
  }, [persistSession]);
  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, [persistSession]);
  const deleteAccount = useCallback(async () => {
    if (!user) {
      throw new Error('Not logged in.');
    }

    const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete account.');
    }

    setUser(null);
    persistSession(null);

    return true;
  }, [user, persistSession]);
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
      avatar: getAvatarOrDefault(data.avatar || user.avatar),
      banner_color: data.banner_color ?? user.banner_color ?? '',
      banner_image: data.banner_image ?? user.banner_image ?? '',
      is_admin: data.is_admin ?? user.is_admin,
      isAdmin: data.isAdmin ?? user.isAdmin,
    };

    setUser(updatedUser);
    persistSession(updatedUser);

    return updatedUser;
  }, [user, persistSession]);
  const value = {
    user,
    isLoggedIn,
    loading,
    register,
    login,
    logout,
    updateProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// This hook intentionally lives beside its provider for a small student project.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
