import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../services/supabaseClient";
import { registerSession, closeSession } from "../services/userActivity";
import { useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  permissions: string[];
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>(['access_courses']);
  const [loading, setLoading] = useState(true);

  // Flags para evitar llamadas duplicadas
  const sessionRegistered = useRef<Set<string>>(new Set());
  const permissionsLoaded = useRef<Set<string>>(new Set());

  // 1. Inicialización de sesión solo una vez al montar
  useEffect(() => {
    // CRÍTICO: Detectar y limpiar tokens del proyecto viejo
    const oldProjectUrl = 'aiyvpzyslfsuodxbuadb.supabase.co';
    let foundOldToken = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('supabase.auth.token')) {
        const value = localStorage.getItem(key);
        if (value?.includes(oldProjectUrl)) {
          localStorage.removeItem(key);
          foundOldToken = true;
        }
      }
    }

    if (foundOldToken) {
      // Token del proyecto viejo encontrado y limpiado
    }

    // Crear un timeout para evitar esperas muy largas
    const timeoutId = setTimeout(() => {
      // Timeout reached
    }, 10000);

    // SEGURIDAD: Usar getUser() en lugar de getSession()
    // getUser() valida con el servidor y no puede ser manipulado
    // getSession() solo lee de localStorage y puede ser alterado
    supabase.auth.getUser()
      .then(async ({ data, error }) => {
        clearTimeout(timeoutId);

        if (error) {
          // Diferenciar entre tipos de error
          const isNetworkError = error.message?.includes('fetch') ||
                                 error.message?.includes('network') ||
                                 error.name === 'TypeError';

          if (isNetworkError) {
            // Network error logged
          } else {
            // Authentication error logged
          }

          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Si hay usuario válido, obtener la sesión completa
        if (data.user) {
          const { data: sessionData } = await supabase.auth.getSession();
          setSession(sessionData.session);
          setUser(data.user);
          // NO ponemos loading = false aquí, esperamos a que se carguen los permisos
        } else {
          setSession(null);
          setUser(null);
          setLoading(false); // Sin usuario, terminamos de cargar
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);

        // Diferenciar entre tipos de error
        const isNetworkError = error.message?.includes('fetch') ||
                               error.message?.includes('network') ||
                               error.name === 'TypeError';

        if (isNetworkError) {
          // Network error handled
        } else {
          // Authentication error handled
        }

        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // 2. Listener de cambios de sesión
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Solo ponemos loading = false si NO hay sesión
        // Si hay sesión, el useEffect de permisos será el que lo ponga en false
        if (!session) {
          setLoading(false);
        }

        if (window.location.hash.includes("access_token")) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 3. Registrar inicio de sesión solo cuando user cambia de null a un id válido
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    if (user && user.id !== prevUserId.current && !sessionRegistered.current.has(user.id)) {
      // Marcar como registrado antes de la llamada para evitar duplicados
      sessionRegistered.current.add(user.id);

      registerSession(user.id, window.navigator.userAgent)
        .then((result) => {
          if (!result.success) {
            // Error registering session
            sessionRegistered.current.delete(user.id);
          } else {
            // Session registered successfully
          }
        })
        .catch((_err: unknown) => {
          // Unexpected error
          sessionRegistered.current.delete(user.id);
        });

      prevUserId.current = user.id;
    }
  }, [user]);

  // 4. Cargar permisos cuando el usuario cambia
  useEffect(() => {
    if (!user) {
      setPermissions(['access_courses']);
      setLoading(false);
      return;
    }

    // Evitar cargar permisos duplicados
    if (permissionsLoaded.current.has(user.id)) {
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('permissions')
          .eq('id', user.id)
          .single();

        if (error) {
          setPermissions(['access_courses']);
        } else {
          const userPermissions = data.permissions || ['access_courses'];
          setPermissions(userPermissions);
          permissionsLoaded.current.add(user.id); // Marcar como cargado
        }
      } catch (err) {
        setPermissions(['access_courses']);
      } finally {
        setLoading(false); // Siempre terminar loading
      }
    };

    loadPermissions();
  }, [user]);

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        return { error };
      }

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (user) {
      const result = await closeSession(user.id);

      if (!result.success) {
        // Error closing session in DB
      } else {
        // Session closed successfully in DB
      }
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, permissions, loading, signInWithEmail, signInWithPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
