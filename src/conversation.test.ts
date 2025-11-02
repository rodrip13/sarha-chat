/**
 * 🧪 Tests para conversation localStorage operations
 * Ejecutar manualmente en la consola del navegador o en Node.js
 */

// Importar las funciones a testear
import { ConversationStorageManager } from './services/conversationService';

// 🧹 Limpiar antes de tests
console.log('🧪 [CONVERSATION TESTS] Limpiando localStorage antes de tests...');
ConversationStorageManager.clearAll();

// Test 1: Crear conversación
console.log('🧪 [CONVERSATION TEST 1] Probando crear conversación...');
const testConversation = ConversationStorageManager.createConversation('test-user-123');
if (testConversation) {
  console.log('✅ [CONVERSATION TEST 1] Conversación creada exitosamente:', testConversation.id);
} else {
  console.error('❌ [CONVERSATION TEST 1] Error creando conversación');
}

// Test 2: Agregar mensaje a conversación
console.log('🧪 [CONVERSATION TEST 2] Probando agregar mensaje...');
if (testConversation) {
  const messageAdded = ConversationStorageManager.addMessage(testConversation.id, {
    text: 'Hola, soy un mensaje de prueba',
    isUser: true,
    timestamp: new Date().toISOString(),
  });
  console.log('✅ [CONVERSATION TEST 2] Mensaje agregado:', messageAdded);
}

// Test 3: Agregar respuesta de IA
console.log('🧪 [CONVERSATION TEST 3] Probando agregar respuesta de IA...');
if (testConversation) {
  const aiMessageAdded = ConversationStorageManager.addMessage(testConversation.id, {
    text: 'Hola, soy una respuesta de IA de prueba',
    isUser: false,
    timestamp: new Date().toISOString(),
  });
  console.log('✅ [CONVERSATION TEST 3] Respuesta de IA agregada:', aiMessageAdded);
}

// Test 4: Obtener conversaciones de usuario
console.log('🧪 [CONVERSATION TEST 4] Probando obtener conversaciones de usuario...');
const userConversations = ConversationStorageManager.getUserConversations('test-user-123');
console.log('📊 [CONVERSATION TEST 4] Conversaciones encontradas:', userConversations.length);
console.log('📋 [CONVERSATION TEST 4] Detalles:', userConversations.map(c => ({
  id: c.id,
  messages: c.messageCount,
  title: c.title
})));

// Test 5: Obtener conversación específica
console.log('🧪 [CONVERSATION TEST 5] Probando obtener conversación específica...');
if (testConversation) {
  const specificConversation = ConversationStorageManager.getConversation(testConversation.id);
  console.log('📊 [CONVERSATION TEST 5] Conversación obtenida:', specificConversation ? {
    id: specificConversation.id,
    messages: specificConversation.messages.length,
    title: specificConversation.title
  } : 'No encontrada');
}

// Test 6: Marcar como sincronizada
console.log('🧪 [CONVERSATION TEST 6] Probando marcar como sincronizada...');
if (testConversation) {
  const marked = ConversationStorageManager.markSynced(testConversation.id);
  console.log('✅ [CONVERSATION TEST 6] Conversación marcada como sincronizada:', marked);
}

// Test 7: Crear otra conversación para probar límites
console.log('🧪 [CONVERSATION TEST 7] Probando crear múltiples conversaciones...');
const conversation2 = ConversationStorageManager.createConversation('test-user-123');
const conversation3 = ConversationStorageManager.createConversation('test-user-123');
console.log('✅ [CONVERSATION TEST 7] Conversaciones creadas:', {
  conv2: conversation2?.id,
  conv3: conversation3?.id
});

// Test 8: Verificar límite de conversaciones
console.log('🧪 [CONVERSATION TEST 8] Verificando límite de conversaciones...');
const allUserConversations = ConversationStorageManager.getUserConversations('test-user-123');
console.log('📊 [CONVERSATION TEST 8] Total de conversaciones del usuario:', allUserConversations.length);

// Test 9: Cleanup (no debería eliminar datos recientes)
console.log('🧪 [CONVERSATION TEST 9] Probando cleanup de conversaciones antiguas...');
const cleanedCount = ConversationStorageManager.cleanupOldConversations();
console.log('🧹 [CONVERSATION TEST 9] Conversaciones eliminadas:', cleanedCount);

// Test 10: Eliminar conversación
console.log('🧪 [CONVERSATION TEST 10] Probando eliminar conversación...');
if (conversation2) {
  const deleted = ConversationStorageManager.deleteConversation(conversation2.id);
  console.log('✅ [CONVERSATION TEST 10] Conversación eliminada:', deleted);
}

// Test 11: Verificar después de eliminación
console.log('🧪 [CONVERSATION TEST 11] Verificando después de eliminación...');
const conversationsAfterDelete = ConversationStorageManager.getUserConversations('test-user-123');
console.log('📊 [CONVERSATION TEST 11] Conversaciones restantes:', conversationsAfterDelete.length);

// Test 12: Limpiar todo
console.log('🧪 [CONVERSATION TEST 12] Probando limpiar todo...');
const cleared = ConversationStorageManager.clearAll();
console.log('🗑️ [CONVERSATION TEST 12] localStorage limpiado:', cleared);

// Verificar que esté vacío
const emptyConversations = ConversationStorageManager.getUserConversations('test-user-123');
console.log('📊 [CONVERSATION TEST 12] Conversaciones después de limpiar:', emptyConversations.length);

console.log('🎉 [CONVERSATION TESTS] Todos los tests completados!');

// Función helper para ejecutar tests automáticamente
export function runConversationTests() {
  console.log('🚀 Ejecutando tests de conversaciones...');

  // Test básico de funcionamiento
  const testData = ConversationStorageManager.getData();
  if (testData && testData.version) {
    console.log('✅ ConversationStorage funciona correctamente');
    return true;
  } else {
    console.error('❌ Error en ConversationStorage');
    return false;
  }
}

// Ejecutar tests si se importa este archivo
if (typeof window !== 'undefined') {
  // En navegador, ejecutar automáticamente
  runConversationTests();
}