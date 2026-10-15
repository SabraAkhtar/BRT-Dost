import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin, getAuthMe, logoutAdmin } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brt_dost_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('brt_dost_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('brt_dost_token');
      if (storedToken) {
        try {
          const res = await getAuthMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('brt_dost_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem('brt_dost_token');
          localStorage.removeItem('brt_dost_user');
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (credentials) => {
    const res = await loginAdmin(credentials);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('brt_dost_token', res.token);
      localStorage.setItem('brt_dost_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    await logoutAdmin();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout
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
