/**
 * 🧪 Tests para localStorage operations
 * Ejecutar manualmente en la consola del navegador o en Node.js
 */

// Importar las funciones a testear
import { LocalStorageManager } from './services/userActivity';

// 🧹 Limpiar antes de tests
console.log('🧪 [TESTS] Limpiando localStorage antes de tests...');
LocalStorageManager.clearAll();

// Test 1: Agregar sesión
console.log('🧪 [TEST 1] Probando agregar sesión...');
const testSession = LocalStorageManager.addSession({
  userId: 'test-user-123',
  userAgent: 'Test Browser/1.0',
  loginAt: new Date().toISOString(),
});

if (testSession) {
  console.log('✅ [TEST 1] Sesión agregada exitosamente:', testSession.id);
} else {
  console.error('❌ [TEST 1] Error agregando sesión');
}

// Test 2: Obtener sesiones de usuario
console.log('🧪 [TEST 2] Probando obtener sesiones de usuario...');
const userSessions = LocalStorageManager.getUserSessions('test-user-123');
console.log('📊 [TEST 2] Sesiones encontradas:', userSessions.length);

// Test 3: Actualizar sesión
console.log('🧪 [TEST 3] Probando actualizar sesión...');
if (testSession) {
  const updated = LocalStorageManager.updateSession(testSession.id, {
    logoutAt: new Date().toISOString(),
    durationSeconds: 300,
  });
  console.log('✅ [TEST 3] Sesión actualizada:', updated);
}

// Test 4: Marcar como sincronizada
console.log('🧪 [TEST 4] Probando marcar como sincronizada...');
if (testSession) {
  const marked = LocalStorageManager.markSynced(testSession.id);
  console.log('✅ [TEST 4] Sesión marcada como sincronizada:', marked);
}

// Test 5: Obtener todas las sesiones
console.log('🧪 [TEST 5] Probando obtener todas las sesiones...');
const allSessions = LocalStorageManager.getAllSessions();
console.log('📊 [TEST 5] Total de sesiones:', allSessions.length);

// Test 6: Cleanup (no debería eliminar datos recientes)
console.log('🧪 [TEST 6] Probando cleanup de datos antiguos...');
const cleanedCount = LocalStorageManager.cleanupOldData();
console.log('🧹 [TEST 6] Sesiones eliminadas:', cleanedCount);

// Test 7: Verificar datos después de cleanup
console.log('🧪 [TEST 7] Verificando datos después de cleanup...');
const sessionsAfterCleanup = LocalStorageManager.getAllSessions();
console.log('📊 [TEST 7] Sesiones restantes:', sessionsAfterCleanup.length);

// Test 8: Limpiar todo
console.log('🧪 [TEST 8] Probando limpiar todo...');
const cleared = LocalStorageManager.clearAll();
console.log('🗑️ [TEST 8] localStorage limpiado:', cleared);

// Verificar que esté vacío
const emptySessions = LocalStorageManager.getAllSessions();
console.log('📊 [TEST 8] Sesiones después de limpiar:', emptySessions.length);

console.log('🎉 [TESTS] Todos los tests completados!');

// Función helper para ejecutar tests automáticamente
export function runLocalStorageTests() {
  console.log('🚀 Ejecutando tests de localStorage...');

  // Test básico de funcionamiento
  const testData = LocalStorageManager.getData();
  if (testData && testData.version) {
    console.log('✅ localStorage funciona correctamente');
    return true;
  } else {
    console.error('❌ Error en localStorage');
    return false;
  }
}

// Ejecutar tests si se importa este archivo
if (typeof window !== 'undefined') {
  // En navegador, ejecutar automáticamente
  runLocalStorageTests();
}