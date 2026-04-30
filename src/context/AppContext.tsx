import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AppContextType {
  lang: 'ar' | 'en';
  toggleLang: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  user: { name: string; email: string; photoURL: string; uid: string } | null;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (e: string, p: string) => Promise<boolean>;
  registerWithEmail: (e: string, p: string) => Promise<boolean>;
  demoLogin: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<'ar' | 'en'>(() => (localStorage.getItem('lang') as 'ar' | 'en') || 'ar');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [user, setUser] = useState<{ name: string; email: string; photoURL: string; uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Language ──
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ── Theme ──
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ── Firebase Auth State Listener ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Get fresh ID token for backend API calls
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('token', idToken);
        localStorage.setItem('uid', firebaseUser.uid);

        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          uid: firebaseUser.uid,
        });
      } else {
        // Check for demo user in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
        } else {
          setUser(null);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
      }
      setAuthLoading(false);
    });

    // Token refresh every 55 minutes (Firebase tokens expire at 60 min)
    const refreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const newToken = await currentUser.getIdToken(true);
        localStorage.setItem('token', newToken);
      }
    }, 55 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  // ── Google Sign-In ──
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('token', idToken);
      return true;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      // Don't throw on popup closed by user
      if (error.code === 'auth/popup-closed-by-user') return false;
      if (error.code === 'auth/cancelled-popup-request') return false;
      throw error;
    }
  };

  // ── Email/Password Sign-In ──
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('token', idToken);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('token', idToken);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // ── Demo Login (for testing without Firebase) ──
  const demoLogin = () => {
    const demoUser = {
      name: 'Demo User',
      email: 'demo@baseerflow.com',
      photoURL: '',
      uid: 'demo_user_001',
    };
    setUser(demoUser);
    localStorage.setItem('token', 'demo_token');
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('uid', demoUser.uid);
  };

  // ── Logout ──
  const logout = async () => {
    try { await signOut(auth); } catch {}
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('uid');
  };

  return (
    <AppContext.Provider value={{ 
      lang, toggleLang, theme, toggleTheme, 
      user, loginWithGoogle, loginWithEmail, registerWithEmail, demoLogin, logout, 
      isAuthenticated: !!user, authLoading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
