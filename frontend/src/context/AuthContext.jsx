import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // Cas de sortie anticipée légitime : pas de token, rien à charger.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- early bail-out, pas de cascade de rendus réelle ici
      setLoading(false);
      return;
    }

    api.get('/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };
  const register = async (payload) => {
    await api.post('/register', payload);
    // Pas d'auto-login : l'API /register ne renvoie pas de token,
    // l'utilisateur doit se connecter explicitement ensuite.
  };


  const logout = async () => {
    await api.post('/logout');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register,  logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-localisé volontairement avec son Provider
export const useAuth = () => useContext(AuthContext);