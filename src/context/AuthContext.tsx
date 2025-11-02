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
    console.log('🚀 [AUTH INIT] Iniciando verificación de sesión...');
    
    // CRÍTICO: Detectar y limpiar tokens del proyecto viejo
    const oldProjectUrl = 'aiyvpzyslfsuodxbuadb.supabase.co';
    let foundOldToken = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('supabase.auth.token')) {
        const value = localStorage.getItem(key);
        if (value?.includes(oldProjectUrl)) {
          console.warn('🚨 [AUTH INIT] ¡TOKEN DEL PROYECTO VIEJO DETECTADO!');
          console.warn('🚨 [AUTH INIT] URL antigua:', oldProjectUrl);
          console.warn('🚨 [AUTH INIT] Esto causa ERR_NAME_NOT_RESOLVED');
          console.warn('🗑️ [AUTH INIT] Eliminando token viejo:', key);
          localStorage.removeItem(key);
          foundOldToken = true;
        }
      }
    }

    if (foundOldToken) {
      console.warn('✅ [AUTH INIT] Tokens viejos eliminados');
      console.warn('🔄 [AUTH INIT] Continuando con inicialización limpia');
    }
    
    // Crear un timeout para evitar esperas muy largas
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ [AUTH INIT] TIMEOUT alcanzado (5 segundos)');
      console.warn('⏱️ [AUTH INIT] Continuando sin autenticación');
      setSession(null);
      setUser(null);
      setLoading(false);
    }, 5000); // 5 segundos máximo (aumentado desde 3s)

    console.log('📡 [AUTH INIT] Llamando a supabase.auth.getUser() [SECURE]...');
    const startTime = Date.now();
    
    // SEGURIDAD: Usar getUser() en lugar de getSession()
    // getUser() valida con el servidor y no puede ser manipulado
    // getSession() solo lee de localStorage y puede ser alterado
    supabase.auth.getUser()
      .then(async ({ data, error }) => {
        const elapsed = Date.now() - startTime;
        clearTimeout(timeoutId);
        
        console.log(`✅ [AUTH INIT] getUser() completado en ${elapsed}ms`);
        console.log('📦 [AUTH INIT] Datos recibidos:', {
          hasUser: !!data.user,
          hasError: !!error,
          userData: data.user ? {
            userId: data.user.id,
            email: data.user.email
          } : null
        });
        
        if (error) {
          // Diferenciar entre tipos de error
          const isNetworkError = error.message?.includes('fetch') || 
                                 error.message?.includes('network') ||
                                 error.name === 'TypeError';
          
          if (isNetworkError) {
            console.error('🌐 [AUTH INIT] Error de red:', error);
          } else {
            console.error('🔐 [AUTH INIT] Error de autenticación:', error);
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
        
        console.log('🎯 [AUTH INIT] Estado actualizado:', {
          authenticated: !!data.user,
          loading: !!data.user // Sigue cargando si hay usuario
        });
      })
      .catch((error) => {
        const elapsed = Date.now() - startTime;
        clearTimeout(timeoutId);
        
        // Diferenciar entre tipos de error
        const isNetworkError = error.message?.includes('fetch') || 
                               error.message?.includes('network') ||
                               error.name === 'TypeError';
        
        if (isNetworkError) {
          console.error(`🌐 [AUTH INIT] Error de red después de ${elapsed}ms:`, error);
          console.error('🌐 [AUTH INIT] Verifica tu conexión a internet y la URL de Supabase');
        } else {
          console.error(`🔐 [AUTH INIT] Error de autenticación después de ${elapsed}ms:`, error);
        }
        
        console.error('❌ [AUTH INIT] Tipo de error:', error.name);
        console.error('❌ [AUTH INIT] Mensaje:', error.message);
        
        setSession(null);
        setUser(null);
        setLoading(false);
        
        console.log('🎯 [AUTH INIT] Estado actualizado tras error: NO autenticado');
      });

    // Cleanup function
    return () => {
      console.log('🧹 [AUTH INIT] Limpiando timeout');
      clearTimeout(timeoutId);
    };
  }, []);

  // 2. Listener de cambios de sesión
  useEffect(() => {
    console.log('👂 [AUTH LISTENER] Configurando listener de cambios de autenticación...');
    
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 [AUTH LISTENER] Cambio detectado!');
        console.log('📋 [AUTH LISTENER] Evento:', event);
        console.log('📦 [AUTH LISTENER] Sesión:', session ? {
          userId: session.user?.id,
          email: session.user?.email,
          expiresAt: session.expires_at
        } : null);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Solo ponemos loading = false si NO hay sesión
        // Si hay sesión, el useEffect de permisos será el que lo ponga en false
        if (!session) {
          setLoading(false);
        }
        
        if (window.location.hash.includes("access_token")) {
          console.log('🔗 [AUTH LISTENER] Token detectado en URL, limpiando...');
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
        
        console.log('🎯 [AUTH LISTENER] Estado actualizado:', {
          event,
          authenticated: !!session,
          loading: !!session // Sigue cargando si hay sesión
        });
      }
    );
    
    console.log('✅ [AUTH LISTENER] Listener configurado exitosamente');
    
    return () => {
      console.log('🧹 [AUTH LISTENER] Desuscribiendo listener...');
      listener.subscription.unsubscribe();
    };
  }, []);

  // 3. Registrar inicio de sesión solo cuando user cambia de null a un id válido
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    if (user && user.id !== prevUserId.current && !sessionRegistered.current.has(user.id)) {
      console.log('✨ [USER SESSION] Nuevo usuario detectado, registrando sesión...');
      console.log('📋 [USER SESSION] UserAgent:', window.navigator.userAgent.substring(0, 50) + '...');

      // Marcar como registrado antes de la llamada para evitar duplicados
      sessionRegistered.current.add(user.id);

      registerSession(user.id, window.navigator.userAgent)
        .then((result) => {
          if (!result.success) {
            console.error("❌ [USER SESSION] Error registrando sesión:", result.error);
            // Si falla, permitir reintentar en el futuro
            sessionRegistered.current.delete(user.id);
          } else {
            console.log("✅ [USER SESSION] Sesión registrada exitosamente");
          }
        })
        .catch((err: unknown) => {
          console.error("❌ [USER SESSION] Error inesperado (catch):", err);
          // Si falla, permitir reintentar en el futuro
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
      console.log('ℹ️ [PERMISSIONS LOAD] Permisos ya cargados para:', user.id);
      setLoading(false);
      return;
    }

    console.log('🔐 [PERMISSIONS LOAD] Cargando permisos para:', user.id);

    const loadPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('permissions')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ [PERMISSIONS LOAD] Error cargando permisos:', error);
          setPermissions(['access_courses']);
        } else {
          const userPermissions = data.permissions || ['access_courses'];
          setPermissions(userPermissions);
          console.log('✅ [PERMISSIONS LOAD] Permisos cargados:', userPermissions);
          permissionsLoaded.current.add(user.id); // Marcar como cargado
        }
      } catch (err) {
        console.error('❌ [PERMISSIONS LOAD] Error inesperado:', err);
        setPermissions(['access_courses']);
      } finally {
        setLoading(false); // Siempre terminar loading
      }
    };

    loadPermissions();
  }, [user]);

  const signInWithEmail = async (email: string) => {
    console.log('📧 [SIGN IN EMAIL] Iniciando login con magic link...');
    console.log('📧 [SIGN IN EMAIL] Email:', email);
    
    try {
      const { error, data } = await supabase.auth.signInWithOtp({ email });
      
      if (error) {
        console.error('❌ [SIGN IN EMAIL] Error:', error);
        return { error };
      }
      
      console.log('✅ [SIGN IN EMAIL] Magic link enviado exitosamente');
      console.log('📦 [SIGN IN EMAIL] Datos:', data);
      return { error };
    } catch (err) {
      console.error('❌ [SIGN IN EMAIL] Error inesperado:', err);
      return { error: err };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    console.log('🔐 [SIGN IN PASSWORD] Iniciando login con contraseña...');
    console.log('🔐 [SIGN IN PASSWORD] Email:', email);
    
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ [SIGN IN PASSWORD] Error:', error);
        return { error };
      }
      
      console.log('✅ [SIGN IN PASSWORD] Login exitoso');
      console.log('📦 [SIGN IN PASSWORD] Usuario:', {
        id: data.user?.id,
        email: data.user?.email
      });
      return { error };
    } catch (err) {
      console.error('❌ [SIGN IN PASSWORD] Error inesperado:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('🚪 [SIGN OUT] Iniciando cierre de sesión...');
    console.log('🚪 [SIGN OUT] Usuario actual:', user?.id);
    
    if (user) {
      console.log('💾 [SIGN OUT] Cerrando sesión en base de datos...');
      const result = await closeSession(user.id);
      
      if (!result.success) {
        console.error("❌ [SIGN OUT] Error cerrando sesión en DB:", result.error);
      } else {
        console.log("✅ [SIGN OUT] Sesión cerrada en DB exitosamente");
      }
    }
    
    console.log('🔓 [SIGN OUT] Cerrando sesión en Supabase Auth...');
    await supabase.auth.signOut();
    console.log('✅ [SIGN OUT] Logout completado');
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
