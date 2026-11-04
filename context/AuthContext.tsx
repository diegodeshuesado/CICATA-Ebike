import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { api, PendingApprovalError } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateAuthUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      return JSON.parse(saved) as User;
    }
    return null;
  });

  const isAuthenticated = !!user;

  // Al arrancar, si hay un usuario y un token guardados, se verifica contra
  // el backend que la sesión siga siendo válida (S2: los tokens expiran a
  // los 7 días y pueden invalidarse con logout). Si el servidor confirma
  // que ya no es válida, se cierra sesión localmente. Si el backend está
  // inalcanzable (error de red), se conserva la sesión en caché para
  // permitir el modo offline ya usado en `login`.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.verifySession().then((result) => {
      if (cancelled) return;
      if (result === null) {
        setUser(null);
        localStorage.removeItem('auth_user');
      } else if (result) {
        setUser(result);
        localStorage.setItem('auth_user', JSON.stringify(result));
      }
      // result === undefined: error de red, no se toca la sesión en caché
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        const usersList: User[] = JSON.parse(savedUsers);
        const currentUserInList = usersList.find(u => u.id === user.id);
        if (currentUserInList && JSON.stringify(currentUserInList) !== JSON.stringify(user)) {
          setUser(currentUserInList);
          localStorage.setItem('auth_user', JSON.stringify(currentUserInList));
        }
      }
    }
  }, [user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // 1. Intentar login contra la base de datos SQLite por API (con verificación real de contraseña)
    try {
      const apiUser = await api.login(email, pass);
      if (apiUser) {
        setUser(apiUser);
        localStorage.setItem('auth_user', JSON.stringify(apiUser));
        return true;
      }
      // El backend respondió pero rechazó las credenciales (401): NO se
      // debe caer al fallback local, o estaríamos dejando entrar a
      // cualquiera con solo saber un correo válido.
      return false;
    } catch (err) {
      // F1: cuenta auto-registrada pendiente de aprobación (403) -- NO es
      // un error de red, así que tampoco debe caer al modo offline local
      // (podría "colar" a alguien si su correo coincidiera con un usuario
      // de MOCK_USERS). Se relanza para que pages/Login.tsx muestre el
      // mensaje específico en vez de "credenciales incorrectas".
      if (err instanceof PendingApprovalError) {
        throw err;
      }
      // 2. Solo si el backend es inalcanzable (error de red real) se usa el
      // modo degradado local / MOCK_USERS, sin verificar contraseña porque
      // no hay ningún hash disponible fuera de la BD. Es un modo de demo
      // offline, no un mecanismo de autenticación seguro.
      console.warn('Backend de autenticación inalcanzable, usando modo offline local:', err);
      const saved = localStorage.getItem('users');
      const usersList: User[] = saved ? JSON.parse(saved) : MOCK_USERS;
      const found = usersList.find(u => u.email === email);
      if (found) {
        setUser(found);
        localStorage.setItem('auth_user', JSON.stringify(found));
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    // Invalida el token en el servidor (borra la fila en sesiones_auth) sin
    // bloquear la UI -- si falla (backend caído), la sesión local ya quedó
    // cerrada de todas formas y el token expirará solo a los 7 días.
    api.logout().catch(() => {});
  };

  const updateAuthUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
