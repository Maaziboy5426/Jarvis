import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase.js';

const STORAGE_KEYS = {
  authUser: 'jarvis_auth_user',
  history: 'jarvis_history',
  macros: 'jarvis_saved_macros',
  templates: 'jarvis_templates',
  apiKey: 'jarvis_gemini_key',
  apiEndpoint: 'jarvis_gemini_endpoint',
  theme: 'jarvis_theme',
  fontSize: 'jarvis_font_size',
  intentLocalOnly: 'jarvis_intent_local_only',
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [history, setHistory] = useState(() => readJson(STORAGE_KEYS.history, []));
  const [macros, setMacros] = useState(() => readJson(STORAGE_KEYS.macros, []));
  const [theme, setTheme] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === 'light' || stored === 'dark') return stored;
      return 'dark';
    } catch {
      return 'dark';
    }
  });
  const [fontSize, setFontSize] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.fontSize);
      if (stored === 'small' || stored === 'medium' || stored === 'large') return stored;
      return 'medium';
    } catch {
      return 'medium';
    }
  });
  const [intentLocalOnly, setIntentLocalOnly] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.intentLocalOnly);
      return stored === '1';
    } catch {
      return false;
    }
  });

  // Initialize API key from .env if not in localStorage
  useEffect(() => {
    const existingApiKey = window.localStorage.getItem(STORAGE_KEYS.apiKey);
    if (!existingApiKey) {
      // Try to get from .env (this won't work in browser, but let's try)
      // For now, we'll set a default or prompt user
      console.log('No API key found in localStorage. Please configure it in Settings.');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || '',
          avatarUrl: session.user.user_metadata?.avatar_url || null,
        });
      } else {
        setAuthUser(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || '',
          avatarUrl: session.user.user_metadata?.avatar_url || null,
        });
      } else {
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    writeJson(STORAGE_KEYS.history, history);
  }, [history]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.macros, macros);
  }, [macros]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      let sizePx = 16;
      if (fontSize === 'small') sizePx = 13;
      else if (fontSize === 'large') sizePx = 19;
      document.documentElement.style.fontSize = `${sizePx}px`;
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.intentLocalOnly, intentLocalOnly ? '1' : '0');
    } catch {
      // ignore
    }
  }, [intentLocalOnly]);

  const signUp = async ({ email, password, fullName }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const logIn = async ({ identifier, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    if (error) throw error;
  };

  const triggerSplash = () => setShowSplash(true);

  const logInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const addHistoryItem = (item) => {
    const id = crypto.randomUUID();
    const entry = { id, createdAt: new Date().toISOString(), ...item };
    setHistory((prev) => [entry, ...prev].slice(0, 100));
    return id;
  };

  const updateProfile = async ({ fullName, avatarUrl }) => {
    if (!authUser) {
      throw new Error('Not authenticated');
    }

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;
  };

  const value = useMemo(
    () => ({
      authUser,
      isAuthenticated: !!authUser,
      showSplash,
      setShowSplash,
      triggerSplash,
      history,
      macros,
      setMacros,
      theme,
      setTheme,
      fontSize,
      setFontSize,
      intentLocalOnly,
      setIntentLocalOnly,
      signUp,
      logIn,
      logInWithGoogle,
      logInWithGithub,
      logOut,
      addHistoryItem,
      updateProfile,
      storageKeys: STORAGE_KEYS,
    }),
    [authUser, showSplash, history, macros, theme, fontSize, intentLocalOnly, signUp, logIn, logInWithGoogle, logInWithGithub, logOut, addHistoryItem, updateProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

