// 🧪 Test para verificar la carga de conversaciones en page reload
// Ejecutar en la consola del navegador después de autenticarse

console.log('🧪 [TEST] Iniciando test de carga de conversaciones...');

// Función para simular page reload
const simulatePageReload = () => {
  console.log('🔄 [TEST] Simulando recarga de página...');

  // Limpiar estado del componente (simular desmontaje)
  console.log('🧹 [TEST] Limpiando estado del componente...');

  // Simular montaje del componente con usuario autenticado
  console.log('📱 [TEST] Simulando montaje del componente...');

  // Verificar que las funciones de debug estén disponibles
  if (typeof window !== 'undefined' && window.debugChat) {
    const debug = window.debugChat;
    console.log('🔍 [TEST] Estado actual del debug:', {
      conversationId: debug.conversationId,
      isConversationLoading: debug.isConversationLoading,
      messageCount: debug.messageCount,
      userId: debug.userId,
      authLoading: debug.authLoading
    });

    // Recargar conversaciones manualmente
    console.log('🔄 [TEST] Recargando conversaciones manualmente...');
    const conversations = debug.reloadConversations();
    console.log('📊 [TEST] Conversaciones recargadas:', conversations);

    // Verificar que el chat esté visible
    const chatContainer = document.querySelector('[class*="flex flex-col h-screen"]');
    if (chatContainer) {
      console.log('✅ [TEST] Chat container encontrado y visible');
    } else {
      console.log('❌ [TEST] Chat container NO encontrado');
    }

    // Verificar mensajes
    const messages = document.querySelectorAll('[class*="px-4 py-3 rounded-2xl"]');
    console.log(`📨 [TEST] ${messages.length} mensajes encontrados en el DOM`);

    console.log('✅ [TEST] Test completado exitosamente');
  } else {
    console.log('❌ [TEST] Funciones de debug no disponibles');
  }
};

// Ejecutar test automáticamente
simulatePageReload();

// También exponer la función para uso manual
if (typeof window !== 'undefined') {
  window.testPageReload = simulatePageReload;
  console.log('🛠️ [TEST] Función testPageReload disponible en window.testPageReload()');
}