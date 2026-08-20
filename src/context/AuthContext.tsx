import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { SAMPLE_USER_PRESETS } from '../data/seedOpportunities';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchUserPreset: (presetId: string) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'civicsense_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    const found = SAMPLE_USER_PRESETS.find(u => u.id === savedId);
    return found || SAMPLE_USER_PRESETS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Sync with backend on startup
    api.getCurrentUser(user.id).then(u => {
      if (u) setUser(u);
    }).catch(() => {
      // Keep local state
    });
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const loggedUser = await api.login(email, password);
      setUser(loggedUser);
      setIsAuthenticated(true);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, loggedUser.id);
      setAuthModalOpen(false);
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    try {
      const newUser = await api.register(name, email, password);
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, newUser.id);
      setAuthModalOpen(false);
    } catch (e) {
      console.error('Register error:', e);
      throw e;
    }
  };

  const logout = () => {
    // Switch to guest/default
    setUser(SAMPLE_USER_PRESETS[0]);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const updated = await api.updateProfile({ ...user, ...data });
    setUser(updated);
  };

  const switchUserPreset = (presetId: string) => {
    const preset = SAMPLE_USER_PRESETS.find(u => u.id === presetId);
    if (preset) {
      setUser(preset);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, preset.id);
      api.updateProfile(preset).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        switchUserPreset,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
