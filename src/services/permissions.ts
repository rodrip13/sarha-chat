import { supabase } from './supabaseClient';

// ===== OBTENER PERMISOS DE UN USUARIO =====
export async function getUserPermissions(userId: string) {
  console.log('🔐 [PERMISSIONS] Obteniendo permisos para:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [PERMISSIONS] Error obteniendo permisos:', error);
      // Fallback seguro: solo acceso a cursos
      return { permissions: ['access_courses'], error };
    }

    console.log('✅ [PERMISSIONS] Permisos obtenidos:', data.permissions);
    return { permissions: data.permissions || ['access_courses'] };
  } catch (err) {
    console.error('❌ [PERMISSIONS] Error inesperado:', err);
    return { permissions: ['access_courses'], error: err };
  }
}

// ===== VERIFICAR UN PERMISO ESPECÍFICO =====
export function hasPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  const hasAccess = permissions.includes(requiredPermission);
  console.log(
    `🔑 [PERMISSIONS] ¿Tiene '${requiredPermission}'?`,
    hasAccess ? '✅ SÍ' : '❌ NO'
  );
  return hasAccess;
}

// ===== VERIFICACIONES ESPECÍFICAS POR APP =====
export async function canAccessCourses(userId: string): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId);
  return hasPermission(permissions, 'access_courses');
}

export async function canAccessChat(userId: string): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId);
  return hasPermission(permissions, 'access_chat');
}

export async function canAccessAdmin(userId: string): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId);
  return hasPermission(permissions, 'access_admin');
}

// ===== OTORGAR PERMISO (ADMIN ONLY) =====
export async function grantPermission(
  userId: string,
  permission: string
) {
  console.log(`✅ [GRANT] Otorgando '${permission}' a usuario:`, userId);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [GRANT] Error obteniendo permisos actuales:', error);
      return { success: false, error };
    }

    // Evitar duplicados
    const updatedPermissions = [
      ...new Set([...(data.permissions || []), permission])
    ];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ permissions: updatedPermissions })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ [GRANT] Error actualizando permisos:', updateError);
      return { success: false, error: updateError };
    }

    console.log('✅ [GRANT] Permiso otorgado:', updatedPermissions);
    return { success: true, permissions: updatedPermissions };
  } catch (err) {
    console.error('❌ [GRANT] Error inesperado:', err);
    return { success: false, error: err };
  }
}

// ===== REVOCAR PERMISO (ADMIN ONLY) =====
export async function revokePermission(
  userId: string,
  permission: string
) {
  console.log(`❌ [REVOKE] Revocando '${permission}' de usuario:`, userId);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [REVOKE] Error obteniendo permisos:', error);
      return { success: false, error };
    }

    // Filtrar el permiso a revocar
    const updatedPermissions = (data.permissions || []).filter(
      (p: string) => p !== permission
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ permissions: updatedPermissions })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ [REVOKE] Error actualizando permisos:', updateError);
      return { success: false, error: updateError };
    }

    console.log('✅ [REVOKE] Permiso revocado:', updatedPermissions);
    return { success: true, permissions: updatedPermissions };
  } catch (err) {
    console.error('❌ [REVOKE] Error inesperado:', err);
    return { success: false, error: err };
  }
}

// ===== OBTENER TODOS LOS USUARIOS CON UN PERMISO =====
export async function getUsersWithPermission(permission: string) {
  console.log(`🔍 [SEARCH] Buscando usuarios con permiso: '${permission}'`);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, permissions')
      .contains('permissions', [permission]);

    if (error) {
      console.error('❌ [SEARCH] Error:', error);
      return { success: false, users: [], error };
    }

    console.log(`✅ [SEARCH] Encontrados ${data.length} usuarios`);
    return { success: true, users: data };
  } catch (err) {
    console.error('❌ [SEARCH] Error inesperado:', err);
    return { success: false, users: [], error: err };
  }
}

// ===== OBTENER PERFIL COMPLETO DEL USUARIO =====
export async function getUserProfile(userId: string) {
  console.log('👤 [PROFILE] Obteniendo perfil completo para:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error obteniendo perfil:', error);
      return { profile: null, error };
    }

    console.log('✅ [PROFILE] Perfil obtenido:', data);
    return { profile: data };
  } catch (err) {
    console.error('❌ [PROFILE] Error inesperado:', err);
    return { profile: null, error: err };
  }
}

// ===== ACTUALIZAR PERFIL DE USUARIO =====
export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
) {
  console.log('✏️ [PROFILE] Actualizando perfil de:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error actualizando perfil:', error);
      return { success: false, error };
    }

    console.log('✅ [PROFILE] Perfil actualizado:', data);
    return { success: true, profile: data };
  } catch (err) {
    console.error('❌ [PROFILE] Error inesperado:', err);
    return { success: false, error: err };
  }
}

// ===== LISTA DE PERMISOS DISPONIBLES =====
export const AVAILABLE_PERMISSIONS = [
  { 
    id: 'access_courses', 
    label: 'Acceso a Cursos', 
    description: 'Permite acceder a la plataforma de cursos',
    color: 'blue' 
  },
  { 
    id: 'access_chat', 
    label: 'Acceso a Chat', 
    description: 'Permite acceder al chat en shara.losciclosdemarha.uy',
    color: 'green' 
  },
  { 
    id: 'access_admin', 
    label: 'Acceso Admin', 
    description: 'Acceso a funciones administrativas',
    color: 'red' 
  },
  { 
    id: 'upload_content', 
    label: 'Subir Contenido', 
    description: 'Permitir subida de contenido/archivos',
    color: 'purple' 
  },
];
