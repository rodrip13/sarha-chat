import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: PostgrestError | Error | null;
}

// 🆕 Estructuras de datos para conversaciones en localStorage
export interface LocalMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string; // ISO string
  conversationId: string;
}

export interface LocalConversation {
  id: string;
  userId: string;
  title?: string; // Título generado automáticamente del primer mensaje
  messages: LocalMessage[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  synced: boolean; // ¿Sincronizada con DB?
  messageCount: number;
  lastMessageAt: string; // ISO string
}

export interface ConversationData {
  conversations: LocalConversation[];
  lastCleanup: string; // Última limpieza (ISO string)
  version: string; // Versión del esquema
}

// 🆕 ConversationStorageManager para manejar persistencia local de conversaciones
export class ConversationStorageManager {
  private static readonly STORAGE_KEY = 'sarha_conversations';
  private static readonly SCHEMA_VERSION = '1.0.0';
  private static readonly MAX_CONVERSATIONS = 50; // Límite máximo de conversaciones por usuario
  private static readonly MAX_MESSAGES_PER_CONVERSATION = 100; // Límite de mensajes por conversación
  private static readonly CLEANUP_DAYS = 30; // Días para considerar datos antiguos

  /**
   * Obtiene todos los datos de conversaciones desde localStorage
   */
  static getData(): ConversationData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createEmptyData();
      }

      const data: ConversationData = JSON.parse(stored);

      // Validar versión del esquema
      if (data.version !== this.SCHEMA_VERSION) {
        console.warn('🔄 [CONVERSATION STORAGE] Versión de esquema diferente, migrando datos...');
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error leyendo datos:', error);
      return this.createEmptyData();
    }
  }

  /**
   * Guarda los datos de conversaciones en localStorage
   */
  static saveData(data: ConversationData): boolean {
    try {
      // Actualizar versión y timestamp
      data.version = this.SCHEMA_VERSION;
      data.lastCleanup = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error guardando datos:', error);
      return false;
    }
  }

  /**
   * Crea una nueva conversación
   */
  static createConversation(userId: string, initialMessage?: LocalMessage): LocalConversation | null {
    try {
      const data = this.getData();
      const now = new Date().toISOString();

      const conversation: LocalConversation = {
        id: crypto.randomUUID(),
        userId,
        messages: initialMessage ? [initialMessage] : [],
        createdAt: now,
        updatedAt: now,
        synced: false,
        messageCount: initialMessage ? 1 : 0,
        lastMessageAt: initialMessage ? initialMessage.timestamp : now,
      };

      // Generar título si hay mensaje inicial
      if (initialMessage && initialMessage.isUser) {
        conversation.title = this.generateTitle(initialMessage.text);
      }

      data.conversations.unshift(conversation); // Agregar al inicio

      // Limitar número máximo de conversaciones por usuario
      const userConversations = data.conversations.filter(c => c.userId === userId);
      if (userConversations.length > this.MAX_CONVERSATIONS) {
        // Remover conversaciones más antiguas del usuario
        const conversationsToRemove = userConversations.slice(this.MAX_CONVERSATIONS);
        data.conversations = data.conversations.filter(c =>
          !conversationsToRemove.some(toRemove => toRemove.id === c.id)
        );
      }

      if (this.saveData(data)) {
        return conversation;
      }
      return null;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error creando conversación:', error);
      return null;
    }
  }

  /**
   * Agrega un mensaje a una conversación existente
   */
  static addMessage(conversationId: string, message: Omit<LocalMessage, 'id' | 'conversationId'>): boolean {
    try {
      const data = this.getData();
      const conversationIndex = data.conversations.findIndex(c => c.id === conversationId);

      if (conversationIndex === -1) {
        console.warn('⚠️ [CONVERSATION STORAGE] Conversación no encontrada:', conversationId);
        return false;
      }

      const conversation = data.conversations[conversationIndex];
      const now = new Date().toISOString();

      const newMessage: LocalMessage = {
        ...message,
        id: crypto.randomUUID(),
        conversationId,
        timestamp: message.timestamp || now,
      };

      conversation.messages.push(newMessage);
      conversation.messageCount = conversation.messages.length;
      conversation.updatedAt = now;
      conversation.lastMessageAt = newMessage.timestamp;

      // Limitar mensajes por conversación
      if (conversation.messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
        conversation.messages = conversation.messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION);
        conversation.messageCount = conversation.messages.length;
      }

      // Actualizar título si es el primer mensaje del usuario
      if (!conversation.title && newMessage.isUser) {
        conversation.title = this.generateTitle(newMessage.text);
      }

      return this.saveData(data);
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error agregando mensaje:', error);
      return false;
    }
  }

  /**
   * Obtiene conversaciones de un usuario específico
   */
  static getUserConversations(userId: string): LocalConversation[] {
    try {
      const data = this.getData();
      return data.conversations
        .filter(conversation => conversation.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error obteniendo conversaciones de usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene una conversación específica
   */
  static getConversation(conversationId: string): LocalConversation | null {
    try {
      const data = this.getData();
      return data.conversations.find(c => c.id === conversationId) || null;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error obteniendo conversación:', error);
      return null;
    }
  }

  /**
   * Marca una conversación como sincronizada
   */
  static markSynced(conversationId: string): boolean {
    try {
      const data = this.getData();
      const conversation = data.conversations.find(c => c.id === conversationId);

      if (!conversation) {
        console.warn('⚠️ [CONVERSATION STORAGE] Conversación no encontrada para marcar como sincronizada:', conversationId);
        return false;
      }

      conversation.synced = true;
      conversation.updatedAt = new Date().toISOString();

      return this.saveData(data);
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error marcando conversación como sincronizada:', error);
      return false;
    }
  }

  /**
   * Elimina una conversación
   */
  static deleteConversation(conversationId: string): boolean {
    try {
      const data = this.getData();
      const initialLength = data.conversations.length;
      data.conversations = data.conversations.filter(c => c.id !== conversationId);

      if (data.conversations.length < initialLength) {
        return this.saveData(data);
      }

      console.warn('⚠️ [CONVERSATION STORAGE] Conversación no encontrada para eliminar:', conversationId);
      return false;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error eliminando conversación:', error);
      return false;
    }
  }

  /**
   * Elimina conversaciones antiguas (más de CLEANUP_DAYS días)
   */
  static cleanupOldConversations(): number {
    try {
      const data = this.getData();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS);

      const initialCount = data.conversations.length;
      data.conversations = data.conversations.filter(conversation => {
        const conversationDate = new Date(conversation.createdAt);
        return conversationDate >= cutoffDate;
      });

      const removedCount = initialCount - data.conversations.length;

      if (removedCount > 0) {
        console.log(`🧹 [CONVERSATION STORAGE] Limpieza completada: ${removedCount} conversaciones antiguas eliminadas`);
        this.saveData(data);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error en limpieza:', error);
      return 0;
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
      console.error('❌ [CONVERSATION STORAGE] Error limpiando datos:', error);
      return false;
    }
  }

  /**
   * Crea estructura de datos vacía
   */
  private static createEmptyData(): ConversationData {
    return {
      conversations: [],
      lastCleanup: new Date().toISOString(),
      version: this.SCHEMA_VERSION,
    };
  }

  /**
   * Migra datos de versiones anteriores
   */
  private static migrateData(_oldData: any): ConversationData {
    // Por ahora, crear datos limpios si la versión no coincide
    console.warn('🔄 [CONVERSATION STORAGE] Migración simple: creando datos limpios');
    return this.createEmptyData();
  }

  /**
   * Genera un título automático basado en el primer mensaje
   */
  private static generateTitle(messageText: string): string {
    try {
      // Limpiar y truncar el mensaje para usarlo como título
      const cleanText = messageText.trim();
      const maxLength = 50;

      if (cleanText.length <= maxLength) {
        return cleanText;
      }

      // Truncar en la última palabra completa
      const truncated = cleanText.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');

      if (lastSpaceIndex > 0) {
        return truncated.substring(0, lastSpaceIndex) + '...';
      }

      return truncated + '...';
    } catch (error) {
      console.error('❌ [CONVERSATION STORAGE] Error generando título:', error);
      return 'Conversación';
    }
  }
}

/**
 * 🆕 Sincroniza conversaciones locales no sincronizadas con la base de datos
 * Se ejecuta en background cuando la conexión a DB está disponible
 */
export async function syncConversationsToDB(): Promise<DBResult<{ syncedCount: number; failedCount: number }>> {
  console.log('🔄 [SYNC CONVERSATIONS] Iniciando sincronización de conversaciones locales...');

  try {
    const allConversations = ConversationStorageManager.getData().conversations;
    const unsyncedConversations = allConversations.filter(conversation => !conversation.synced);

    if (unsyncedConversations.length === 0) {
      console.log('✅ [SYNC CONVERSATIONS] No hay conversaciones pendientes de sincronización');
      return { success: true, data: { syncedCount: 0, failedCount: 0 } };
    }

    console.log(`📊 [SYNC CONVERSATIONS] ${unsyncedConversations.length} conversaciones pendientes de sincronización`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const conversation of unsyncedConversations) {
      try {
        // Intentar insertar conversación en DB
        const { error } = await supabase.from("conversations").insert({
          id: conversation.id,
          user_id: conversation.userId,
          title: conversation.title,
          created_at: conversation.createdAt,
          updated_at: conversation.updatedAt,
          message_count: conversation.messageCount,
        });

        if (error) {
          // Si la tabla no existe, marcar como "sincronizado" para evitar reintentos
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.warn(`⚠️ [SYNC CONVERSATIONS] Tabla no existe, marcando conversación ${conversation.id} como sincronizada localmente`);
            ConversationStorageManager.markSynced(conversation.id);
            syncedCount++;
            continue;
          }

          console.error(`❌ [SYNC CONVERSATIONS] Error sincronizando conversación ${conversation.id}:`, error);
          failedCount++;
          continue;
        }

        // Sincronizar mensajes de la conversación
        for (const message of conversation.messages) {
          try {
            const { error: messageError } = await supabase.from("conversation_messages").insert({
              id: message.id,
              conversation_id: message.conversationId,
              content: message.text,
              is_user: message.isUser,
              created_at: message.timestamp,
            });

            if (messageError && !(messageError.code === 'PGRST205' || messageError.message?.includes('Could not find the table'))) {
              console.error(`❌ [SYNC CONVERSATIONS] Error sincronizando mensaje ${message.id}:`, messageError);
            }
          } catch (msgError) {
            console.error(`❌ [SYNC CONVERSATIONS] Error inesperado sincronizando mensaje ${message.id}:`, msgError);
          }
        }

        // Marcar conversación como sincronizada
        ConversationStorageManager.markSynced(conversation.id);
        syncedCount++;
        console.log(`✅ [SYNC CONVERSATIONS] Conversación ${conversation.id} sincronizada exitosamente`);

      } catch (err) {
        console.error(`❌ [SYNC CONVERSATIONS] Error inesperado sincronizando conversación ${conversation.id}:`, err);
        failedCount++;
      }
    }

    console.log(`📊 [SYNC CONVERSATIONS] Sincronización completada: ${syncedCount} exitosas, ${failedCount} fallidas`);
    return { success: true, data: { syncedCount, failedCount } };

  } catch (err) {
    console.error('❌ [SYNC CONVERSATIONS] Error inesperado en sincronización:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * 🆕 Ejecuta limpieza automática de conversaciones antiguas en localStorage
 * Elimina conversaciones de más de 30 días
 */
export function cleanupOldConversations(): number {
  console.log('🧹 [CLEANUP CONVERSATIONS] Iniciando limpieza automática de conversaciones antiguas...');
  const removedCount = ConversationStorageManager.cleanupOldConversations();

  if (removedCount > 0) {
    console.log(`✅ [CLEANUP CONVERSATIONS] Limpieza completada: ${removedCount} conversaciones antiguas eliminadas`);
  } else {
    console.log('✅ [CLEANUP CONVERSATIONS] No se encontraron conversaciones antiguas para limpiar');
  }

  return removedCount;
}

// 🆕 Interfaces para Analytics
export interface ConversationAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  activeConversations: number; // Con mensajes recientes (última semana)
  oldestConversation: string | null;
  newestConversation: string | null;
  conversationsByDay: { [date: string]: number };
}

export interface UserConversationAnalytics {
  userId: string;
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  lastActivity: string | null;
  conversationsThisWeek: number;
  messagesThisWeek: number;
}

/**
 * 🆕 Obtiene estadísticas globales de conversaciones desde localStorage
 */
export function getConversationAnalytics(): ConversationAnalytics {
  try {
    const data = ConversationStorageManager.getData();

    if (data.conversations.length === 0) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        activeConversations: 0,
        oldestConversation: null,
        newestConversation: null,
        conversationsByDay: {},
      };
    }

    const totalMessages = data.conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
    const averageMessagesPerConversation = totalMessages / data.conversations.length;

    // Conversaciones activas (última semana)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const activeConversations = data.conversations.filter(conv =>
      new Date(conv.lastMessageAt) >= oneWeekAgo
    ).length;

    // Fechas de conversaciones
    const sortedConversations = data.conversations.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const oldestConversation = sortedConversations[0]?.createdAt || null;
    const newestConversation = sortedConversations[sortedConversations.length - 1]?.createdAt || null;

    // Conversaciones por día
    const conversationsByDay: { [date: string]: number } = {};
    data.conversations.forEach(conv => {
      const date = new Date(conv.createdAt).toISOString().split('T')[0];
      conversationsByDay[date] = (conversationsByDay[date] || 0) + 1;
    });

    return {
      totalConversations: data.conversations.length,
      totalMessages,
      averageMessagesPerConversation,
      activeConversations,
      oldestConversation,
      newestConversation,
      conversationsByDay,
    };
  } catch (error) {
    console.error('❌ [CONVERSATION ANALYTICS] Error obteniendo analytics globales:', error);
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      activeConversations: 0,
      oldestConversation: null,
      newestConversation: null,
      conversationsByDay: {},
    };
  }
}

/**
 * 🆕 Obtiene estadísticas de conversaciones de un usuario específico
 */
export function getUserConversationAnalytics(userId: string): UserConversationAnalytics {
  try {
    const userConversations = ConversationStorageManager.getUserConversations(userId);

    if (userConversations.length === 0) {
      return {
        userId,
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        lastActivity: null,
        conversationsThisWeek: 0,
        messagesThisWeek: 0,
      };
    }

    const totalMessages = userConversations.reduce((sum, conv) => sum + conv.messageCount, 0);
    const averageMessagesPerConversation = totalMessages / userConversations.length;

    // Última actividad
    const lastActivity = userConversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0]?.lastMessageAt || null;

    // Actividad esta semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const conversationsThisWeek = userConversations.filter(conv =>
      new Date(conv.createdAt) >= oneWeekAgo
    ).length;

    const messagesThisWeek = userConversations
      .filter(conv => new Date(conv.lastMessageAt) >= oneWeekAgo)
      .reduce((sum, conv) => sum + conv.messages.filter(msg =>
        new Date(msg.timestamp) >= oneWeekAgo
      ).length, 0);

    return {
      userId,
      totalConversations: userConversations.length,
      totalMessages,
      averageMessagesPerConversation,
      lastActivity,
      conversationsThisWeek,
      messagesThisWeek,
    };
  } catch (error) {
    console.error('❌ [USER CONVERSATION ANALYTICS] Error obteniendo analytics de usuario:', error);
    return {
      userId,
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      lastActivity: null,
      conversationsThisWeek: 0,
      messagesThisWeek: 0,
    };
  }
}