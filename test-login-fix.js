// 🧪 Test para verificar el fix de acceso denegado después del login
// Ejecutar en la consola del navegador

console.log('🧪 [TEST LOGIN] Iniciando test de login y navegación...');

// Función para verificar el estado de la aplicación
const checkAppState = () => {
  console.log('🔍 [TEST LOGIN] Verificando estado de la aplicación...');

  // Verificar AuthContext
  if (typeof window !== 'undefined' && window.debugAuth) {
    const auth = window.debugAuth;
    console.log('🔐 [TEST LOGIN] Estado de autenticación:', {
      loading: auth.loading,
      userId: auth.user?.id,
      permissions: auth.permissions,
      hasAccessChat: auth.permissions?.includes('access_chat')
    });
  }

  // Verificar elementos DOM
  const loginForm = document.querySelector('[class*="min-h-screen"][class*="flex"][class*="items-center"]');
  const chatContainer = document.querySelector('[class*="flex flex-col h-screen"]');
  const accessDenied = document.querySelector('[class*="Acceso Denegado"]');

  console.log('📱 [TEST LOGIN] Estado del DOM:', {
    loginVisible: !!loginForm,
    chatVisible: !!chatContainer,
    accessDeniedVisible: !!accessDenied
  });

  // Verificar navegación esperada
  if (chatContainer && !accessDenied) {
    console.log('✅ [TEST LOGIN] SUCCESS: Chat visible, acceso denegado oculto');
  } else if (accessDenied) {
    console.log('❌ [TEST LOGIN] FAIL: Acceso denegado visible');
  } else if (loginForm) {
    console.log('ℹ️ [TEST LOGIN] INFO: Formulario de login visible (usuario no autenticado)');
  } else {
    console.log('❓ [TEST LOGIN] UNKNOWN: Estado no reconocido');
  }
};

// Función para simular login exitoso
const simulateLoginSuccess = () => {
  console.log('🎭 [TEST LOGIN] Simulando login exitoso...');

  // Esperar un poco para que se complete el login
  setTimeout(() => {
    console.log('🔄 [TEST LOGIN] Verificando estado post-login...');
    checkAppState();
  }, 2000);
};

// Exponer funciones globales
if (typeof window !== 'undefined') {
  window.checkAppState = checkAppState;
  window.simulateLoginSuccess = simulateLoginSuccess;
  console.log('🛠️ [TEST LOGIN] Funciones disponibles:');
  console.log('   - window.checkAppState()');
  console.log('   - window.simulateLoginSuccess()');
}

// Ejecutar verificación inicial
console.log('🚀 [TEST LOGIN] Ejecutando verificación inicial...');
checkAppState();