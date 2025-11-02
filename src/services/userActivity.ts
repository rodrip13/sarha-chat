import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: PostgrestError | Error | null;
}

// 🆕 Estructuras de datos para localStorage
export interface LocalSession {
  id: string;
  userId: string;
  userAgent: string;
  loginAt: string;
  logoutAt?: string;
  durationSeconds?: number;
  synced: boolean; // Indica si ya se sincronizó con DB
  createdAt: string; // Timestamp de creación en localStorage
  updatedAt: string; // Timestamp de última actualización
}

export interface LocalSessionData {
  sessions: LocalSession[];
  lastCleanup: string; // Última vez que se hizo limpieza
  version: string; // Versión del esquema de datos
}

// 🆕 Clase LocalStorageManager para manejar persistencia local
export class LocalStorageManager {
  private static readonly STORAGE_KEY = 'sarha_user_sessions';
  private static readonly SCHEMA_VERSION = '1.0.0';
  private static readonly MAX_SESSIONS = 1000; // Límite máximo de sesiones almacenadas
  private static readonly CLEANUP_DAYS = 30; // Días para considerar datos antiguos

  /**
   * Obtiene todos los datos de sesiones desde localStorage
   */
  static getData(): LocalSessionData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createEmptyData();
      }

      const data: LocalSessionData = JSON.parse(stored);

      // Validar versión del esquema
      if (data.version !== this.SCHEMA_VERSION) {
        console.warn('🔄 [LOCALSTORAGE] Versión de esquema diferente, migrando datos...');
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error leyendo datos:', error);
      return this.createEmptyData();
    }
  }

  /**
   * Guarda los datos de sesiones en localStorage
   */
  static saveData(data: LocalSessionData): boolean {
    try {
      // Actualizar versión y timestamp
      data.version = this.SCHEMA_VERSION;
      data.lastCleanup = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error guardando datos:', error);
      return false;
    }
  }

  /**
   * Agrega una nueva sesión
   */
  static addSession(session: Omit<LocalSession, 'id' | 'synced' | 'createdAt' | 'updatedAt'>): LocalSession | null {
    try {
      const data = this.getData();
      const now = new Date().toISOString();

      const newSession: LocalSession = {
        ...session,
        id: crypto.randomUUID(),
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      data.sessions.unshift(newSession); // Agregar al inicio

      // Limitar número máximo de sesiones
      if (data.sessions.length > this.MAX_SESSIONS) {
        data.sessions = data.sessions.slice(0, this.MAX_SESSIONS);
      }

      if (this.saveData(data)) {
        return newSession;
      }
      return null;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error agregando sesión:', error);
      return null;
    }
  }

  /**
   * Actualiza una sesión existente
   */
  static updateSession(sessionId: string, updates: Partial<LocalSession>): boolean {
    try {
      const data = this.getData();
      const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);

      if (sessionIndex === -1) {
        console.warn('⚠️ [LOCALSTORAGE] Sesión no encontrada para actualizar:', sessionId);
        return false;
      }

      data.sessions[sessionIndex] = {
        ...data.sessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return this.saveData(data);
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error actualizando sesión:', error);
      return false;
    }
  }

  /**
   * Marca una sesión como sincronizada
   */
  static markSynced(sessionId: string): boolean {
    return this.updateSession(sessionId, { synced: true });
  }

  /**
   * Elimina sesiones antiguas (más de CLEANUP_DAYS días)
   */
  static cleanupOldData(): number {
    try {
      const data = this.getData();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS);

      const initialCount = data.sessions.length;
      data.sessions = data.sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= cutoffDate;
      });

      const removedCount = initialCount - data.sessions.length;

      if (removedCount > 0) {
        console.log(`🧹 [LOCALSTORAGE] Limpieza completada: ${removedCount} sesiones antiguas eliminadas`);
        this.saveData(data);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error en limpieza:', error);
      return 0;
    }
  }

  /**
   * Obtiene sesiones de un usuario específico
   */
  static getUserSessions(userId: string): LocalSession[] {
    try {
      const data = this.getData();
      return data.sessions.filter(session => session.userId === userId);
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error obteniendo sesiones de usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las sesiones
   */
  static getAllSessions(): LocalSession[] {
    try {
      const data = this.getData();
      return data.sessions;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error obteniendo todas las sesiones:', error);
      return [];
    }
  }

  /**
   * Limpia completamente el localStorage (para testing o reset)
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('❌ [LOCALSTORAGE] Error limpiando datos:', error);
      return false;
    }
  }

  /**
   * Crea estructura de datos vacía
   */
  private static createEmptyData(): LocalSessionData {
    return {
      sessions: [],
      lastCleanup: new Date().toISOString(),
      version: this.SCHEMA_VERSION,
    };
  }

  /**
   * Migra datos de versiones anteriores
   */
  private static migrateData(_oldData: any): LocalSessionData {
    // Por ahora, crear datos limpios si la versión no coincide
    console.warn('🔄 [LOCALSTORAGE] Migración simple: creando datos limpios');
    return this.createEmptyData();
  }
}

export async function registerSession(userId: string, userAgent: string): Promise<DBResult> {
  console.log('🔓 [REGISTER SESSION] Registrando sesión de usuario...');

  // 🆕 1. PRIMERO: Guardar en localStorage
  const localSession = LocalStorageManager.addSession({
    userId,
    userAgent,
    loginAt: new Date().toISOString(),
  });

  if (!localSession) {
    console.error('❌ [REGISTER SESSION] Error guardando en localStorage');
    // Continuar con DB de todas formas
  } else {
    console.log('✅ [REGISTER SESSION] Sesión guardada localmente, ID:', localSession.id);
  }

  try {
    const { error, data } = await supabase.from("user_sessions").insert({
      user_id: userId,
      user_agent: userAgent,
    });

    if (error) {
      // Si la tabla no existe, no es un error crítico - solo loggear y continuar
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('⚠️ [REGISTER SESSION] Tabla user_sessions no existe, datos guardados solo localmente');
        return { success: true, data: localSession }; // Considerar como éxito
      }

      console.error('❌ [REGISTER SESSION] Error en DB:', error);
      return { success: false, error };
    }

    // 🆕 2. SEGUNDO: Marcar como sincronizado si se guardó exitosamente en DB
    if (localSession) {
      LocalStorageManager.markSynced(localSession.id);
      console.log('✅ [REGISTER SESSION] Sesión sincronizada con DB');
    }

    console.log('✅ [REGISTER SESSION] Sesión registrada exitosamente');
    return { success: true, data };
  } catch (err) {
    console.error('❌ [REGISTER SESSION] Error inesperado:', err);
    return { success: false, error: err as Error };
  }
}

export async function closeSession(userId: string): Promise<DBResult> {
  console.log('🔒 [CLOSE SESSION] Cerrando sesión de usuario...');

  const now = new Date();
  let localSessionId: string | null = null;

  // 🆕 1. PRIMERO: Buscar y actualizar sesión en localStorage
  try {
    const userSessions = LocalStorageManager.getUserSessions(userId);
    const openSession = userSessions.find(session => !session.logoutAt);

    if (openSession) {
      console.log('📋 [CLOSE SESSION] Sesión abierta encontrada localmente, ID:', openSession.id);

      const duration = Math.floor((now.getTime() - new Date(openSession.loginAt).getTime()) / 1000);

      const updated = LocalStorageManager.updateSession(openSession.id, {
        logoutAt: now.toISOString(),
        durationSeconds: duration,
      });

      if (updated) {
        localSessionId = openSession.id;
        console.log('✅ [CLOSE SESSION] Sesión cerrada localmente, duración:', duration, 'segundos');
      } else {
        console.error('❌ [CLOSE SESSION] Error actualizando sesión local');
      }
    } else {
      console.warn('⚠️ [CLOSE SESSION] No se encontró sesión abierta localmente');
    }
  } catch (error) {
    console.error('❌ [CLOSE SESSION] Error procesando localStorage:', error);
  }

  try {
    console.log('🔍 [CLOSE SESSION] Buscando sesión abierta en DB...');

    const { data, error } = await supabase
      .from("user_sessions")
      .select("id, login_at")
      .eq("user_id", userId)
      .is("logout_at", null)
      .order("login_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Si la tabla no existe, no es un error crítico
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('⚠️ [CLOSE SESSION] Tabla user_sessions no existe, datos guardados solo localmente');
        return { success: true, data: localSessionId ? { id: localSessionId } : null }; // Considerar como éxito
      }

      console.error('❌ [CLOSE SESSION] Error buscando sesión en DB:', error);
      return { success: false, error };
    }

    if (data) {
      console.log('📋 [CLOSE SESSION] Sesión encontrada en DB, ID:', data.id);

      const loginAt = new Date(data.login_at);
      const duration = Math.floor((now.getTime() - loginAt.getTime()) / 1000);

      console.log('⏱️ [CLOSE SESSION] Duración de sesión:', duration, 'segundos');

      const { error: updateError, data: updateData } = await supabase
        .from("user_sessions")
        .update({
          logout_at: now.toISOString(),
          duration_seconds: duration,
        })
        .eq("id", data.id);

      if (updateError) {
        console.error('❌ [CLOSE SESSION] Error actualizando sesión en DB:', updateError);
        return { success: false, error: updateError };
      }

      // 🆕 2. SEGUNDO: Marcar como sincronizado en localStorage
      if (localSessionId) {
        LocalStorageManager.markSynced(localSessionId);
        console.log('✅ [CLOSE SESSION] Sesión sincronizada con DB');
      }

      console.log('✅ [CLOSE SESSION] Sesión cerrada exitosamente');
      return { success: true, data: updateData };
    }

    console.warn('⚠️ [CLOSE SESSION] No se encontró sesión abierta en DB');
    return { success: false, error: new Error("Sesión abierta NO encontrada") };
  } catch (err) {
    console.error('❌ [CLOSE SESSION] Error inesperado:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * 🆕 Sincroniza sesiones locales no sincronizadas con la base de datos
 * Se ejecuta en background cuando la conexión a DB está disponible
 */
export async function syncLocalSessionsToDB(): Promise<DBResult<{ syncedCount: number; failedCount: number }>> {
  console.log('🔄 [SYNC LOCAL] Iniciando sincronización de sesiones locales...');

  try {
    const allSessions = LocalStorageManager.getAllSessions();
    const unsyncedSessions = allSessions.filter(session => !session.synced);

    if (unsyncedSessions.length === 0) {
      console.log('✅ [SYNC LOCAL] No hay sesiones pendientes de sincronización');
      return { success: true, data: { syncedCount: 0, failedCount: 0 } };
    }

    console.log(`📊 [SYNC LOCAL] ${unsyncedSessions.length} sesiones pendientes de sincronización`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const session of unsyncedSessions) {
      try {
        // Intentar insertar en DB
        const { error } = await supabase.from("user_sessions").insert({
          user_id: session.userId,
          user_agent: session.userAgent,
          login_at: session.loginAt,
          logout_at: session.logoutAt,
          duration_seconds: session.durationSeconds,
        });

        if (error) {
          // Si la tabla no existe, marcar como "sincronizado" para evitar reintentos
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.warn(`⚠️ [SYNC LOCAL] Tabla no existe, marcando sesión ${session.id} como sincronizada localmente`);
            LocalStorageManager.markSynced(session.id);
            syncedCount++;
            continue;
          }

          console.error(`❌ [SYNC LOCAL] Error sincronizando sesión ${session.id}:`, error);
          failedCount++;
          continue;
        }

        // Marcar como sincronizada
        LocalStorageManager.markSynced(session.id);
        syncedCount++;
        console.log(`✅ [SYNC LOCAL] Sesión ${session.id} sincronizada exitosamente`);

      } catch (err) {
        console.error(`❌ [SYNC LOCAL] Error inesperado sincronizando sesión ${session.id}:`, err);
        failedCount++;
      }
    }

    console.log(`📊 [SYNC LOCAL] Sincronización completada: ${syncedCount} exitosas, ${failedCount} fallidas`);
    return { success: true, data: { syncedCount, failedCount } };

  } catch (err) {
    console.error('❌ [SYNC LOCAL] Error inesperado en sincronización:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * 🆕 Ejecuta limpieza automática de datos antiguos en localStorage
 * Elimina sesiones de más de 30 días
 */
export function cleanupOldData(): number {
  console.log('🧹 [CLEANUP] Iniciando limpieza automática de datos antiguos...');
  const removedCount = LocalStorageManager.cleanupOldData();

  if (removedCount > 0) {
    console.log(`✅ [CLEANUP] Limpieza completada: ${removedCount} sesiones antiguas eliminadas`);
  } else {
    console.log('✅ [CLEANUP] No se encontraron datos antiguos para limpiar');
  }

  return removedCount;
}

// 🆕 Funciones de Analytics
export interface UserAnalytics {
  totalSessions: number;
  totalDuration: number; // en segundos
  averageSessionDuration: number; // en segundos
  lastLogin: string | null;
  completedSessions: number; // sesiones con logout
  activeSessions: number; // sesiones sin logout
}

export interface GlobalAnalytics {
  totalUsers: number;
  totalSessions: number;
  totalDuration: number; // en segundos
  averageSessionDuration: number; // en segundos
  activeUsers: number; // usuarios con sesiones activas
  completedSessions: number;
  activeSessions: number;
}

/**
 * 🆕 Obtiene estadísticas de usuario desde localStorage
 */
export function getUserAnalytics(userId: string): UserAnalytics {
  try {
    const userSessions = LocalStorageManager.getUserSessions(userId);

    if (userSessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        lastLogin: null,
        completedSessions: 0,
        activeSessions: 0,
      };
    }

    const completedSessions = userSessions.filter(s => s.logoutAt && s.durationSeconds);
    const activeSessions = userSessions.filter(s => !s.logoutAt);

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const averageSessionDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;

    const lastLogin = userSessions
      .sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())[0]?.loginAt || null;

    return {
      totalSessions: userSessions.length,
      totalDuration,
      averageSessionDuration,
      lastLogin,
      completedSessions: completedSessions.length,
      activeSessions: activeSessions.length,
    };
  } catch (error) {
    console.error('❌ [USER ANALYTICS] Error obteniendo analytics de usuario:', error);
    return {
      totalSessions: 0,
      totalDuration: 0,
      averageSessionDuration: 0,
      lastLogin: null,
      completedSessions: 0,
      activeSessions: 0,
    };
  }
}

/**
 * 🆕 Obtiene estadísticas globales desde localStorage
 */
export function getGlobalAnalytics(): GlobalAnalytics {
  try {
    const allSessions = LocalStorageManager.getAllSessions();

    if (allSessions.length === 0) {
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        activeUsers: 0,
        completedSessions: 0,
        activeSessions: 0,
      };
    }

    // Obtener usuarios únicos
    const uniqueUsers = new Set(allSessions.map(s => s.userId));
    const totalUsers = uniqueUsers.size;

    const completedSessions = allSessions.filter(s => s.logoutAt && s.durationSeconds);
    const activeSessions = allSessions.filter(s => !s.logoutAt);

    // Usuarios con sesiones activas
    const activeUsers = new Set(activeSessions.map(s => s.userId)).size;

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const averageSessionDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;

    return {
      totalUsers,
      totalSessions: allSessions.length,
      totalDuration,
      averageSessionDuration,
      activeUsers,
      completedSessions: completedSessions.length,
      activeSessions: activeSessions.length,
    };
  } catch (error) {
    console.error('❌ [GLOBAL ANALYTICS] Error obteniendo analytics globales:', error);
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalDuration: 0,
      averageSessionDuration: 0,
      activeUsers: 0,
      completedSessions: 0,
      activeSessions: 0,
    };
  }
}
