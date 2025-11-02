// ⚠️ ATENCIÓN: Script de migración de permisos - USAR CON CUIDADO
// Este script QUITA el acceso al chat de todos los usuarios
// Solo ejecutar si se quiere revocar acceso masivamente

import { supabase } from './services/supabaseClient';

const revokeChatAccessFromAll = async () => {
  console.warn('� [MIGRATION] ATENCIÓN: Este script QUITA acceso al chat de TODOS los usuarios');
  console.warn('🚨 [MIGRATION] Solo ejecutar si es intencional');

  const confirm = window.confirm('¿Estás seguro de que quieres QUITAR el acceso al chat de TODOS los usuarios?');
  if (!confirm) {
    console.log('❌ [MIGRATION] Operación cancelada por el usuario');
    return;
  }

  try {
    // Obtener todos los perfiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, permissions, email');

    if (fetchError) {
      console.error('❌ [MIGRATION] Error obteniendo perfiles:', fetchError);
      return;
    }

    console.log(`📊 [MIGRATION] Encontrados ${profiles.length} perfiles`);

    let updated = 0;
    let skipped = 0;

    for (const profile of profiles) {
      const currentPermissions = profile.permissions || [];

      // Quitar access_chat si lo tiene
      if (currentPermissions.includes('access_chat')) {
        const newPermissions = currentPermissions.filter(p => p !== 'access_chat');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            permissions: newPermissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ [MIGRATION] Error actualizando perfil ${profile.email}:`, updateError);
        } else {
          console.log(`✅ [MIGRATION] Acceso revocado para ${profile.email}:`, newPermissions);
          updated++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`🎯 [MIGRATION] Completado: ${updated} accesos revocados, ${skipped} ya sin acceso`);

  } catch (error) {
    console.error('❌ [MIGRATION] Error inesperado:', error);
  }
};

// Función para otorgar acceso al chat a usuarios específicos
const grantChatAccess = async (userEmails) => {
  console.log('🎯 [GRANT ACCESS] Otorgando acceso al chat a usuarios específicos...');

  try {
    for (const email of userEmails) {
      // Primero encontrar el perfil por email
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id, permissions')
        .eq('email', email)
        .single();

      if (findError) {
        console.error(`❌ [GRANT ACCESS] Usuario ${email} no encontrado:`, findError);
        continue;
      }

      const currentPermissions = profile.permissions || [];
      if (!currentPermissions.includes('access_chat')) {
        const newPermissions = [...currentPermissions, 'access_chat'];

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            permissions: newPermissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ [GRANT ACCESS] Error otorgando acceso a ${email}:`, updateError);
        } else {
          console.log(`✅ [GRANT ACCESS] Acceso otorgado a ${email}`);
        }
      } else {
        console.log(`ℹ️ [GRANT ACCESS] ${email} ya tiene acceso`);
      }
    }

  } catch (error) {
    console.error('❌ [GRANT ACCESS] Error inesperado:', error);
  }
};

// Función para verificar permisos de un usuario
const checkUserPermissions = async (email) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, permissions, email')
      .eq('email', email)
      .single();

    if (error) {
      console.error(`❌ [CHECK] Error obteniendo permisos de ${email}:`, error);
      return null;
    }

    console.log(`🔍 [CHECK] Permisos de ${email}:`, profile.permissions);
    console.log(`🎯 [CHECK] Tiene acceso al chat:`, profile.permissions?.includes('access_chat'));
    return profile;

  } catch (error) {
    console.error('❌ [CHECK] Error inesperado:', error);
    return null;
  }
};

// Exponer funciones globales
if (typeof window !== 'undefined') {
  window.revokeChatAccessFromAll = revokeChatAccessFromAll;
  window.grantChatAccess = grantChatAccess;
  window.checkUserPermissions = checkUserPermissions;

  console.log('🛠️ [PERMISSIONS MIGRATION] Funciones disponibles:');
  console.log('   - window.revokeChatAccessFromAll() ⚠️ PELIGROSO');
  console.log('   - window.grantChatAccess(["email1@example.com", "email2@example.com"])');
  console.log('   - window.checkUserPermissions("email@example.com")');
}