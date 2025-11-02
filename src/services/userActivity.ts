import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: PostgrestError | Error | null;
}

export async function registerSession(userId: string, userAgent: string): Promise<DBResult> {
  console.log('🔓 [REGISTER SESSION] Registrando sesión de usuario...');

  try {
    const { error, data } = await supabase.from("user_sessions").insert({
      user_id: userId,
      user_agent: userAgent,
    });

    if (error) {
      // Si la tabla no existe, no es un error crítico - solo loggear y continuar
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('⚠️ [REGISTER SESSION] Tabla user_sessions no existe, omitiendo registro');
        return { success: true, data: null }; // Considerar como éxito
      }

      console.error('❌ [REGISTER SESSION] Error:', error);
      return { success: false, error };
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

  try {
    console.log('🔍 [CLOSE SESSION] Buscando sesión abierta...');

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
        console.warn('⚠️ [CLOSE SESSION] Tabla user_sessions no existe, omitiendo cierre');
        return { success: true, data: null }; // Considerar como éxito
      }

      console.error('❌ [CLOSE SESSION] Error buscando sesión:', error);
      return { success: false, error };
    }
    
    if (data) {
      console.log('📋 [CLOSE SESSION] Sesión encontrada, ID:', data.id);
      
      const now = new Date();
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
        console.error('❌ [CLOSE SESSION] Error actualizando sesión:', updateError);
        return { success: false, error: updateError };
      }
      
      console.log('✅ [CLOSE SESSION] Sesión cerrada exitosamente');
      return { success: true, data: updateData };
    }
    
    console.warn('⚠️ [CLOSE SESSION] No se encontró sesión abierta');
    return { success: false, error: new Error("Sesión abierta NO encontrada") };
  } catch (err) {
    console.error('❌ [CLOSE SESSION] Error inesperado:', err);
    return { success: false, error: err as Error };
  }
}
