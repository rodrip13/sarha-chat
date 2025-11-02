import { useState, useEffect } from 'react';
import { Chat } from './components/Chat';
import { ChatService } from './services/chatService';
import { API_CONFIG } from './config/api';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import { LogOut } from 'lucide-react';

const chatService = new ChatService();

type AppState = 'loading' | 'login' | 'chat' | 'access_denied' | 'reset_password';

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [appState, setAppState] = useState<AppState>('loading');
  const { session, permissions, loading, signOut } = useAuth();

  useEffect(() => {
    // Verificar conexión con la API al iniciar
    checkApiConnection();
  }, []);

  // Determinar el estado de la app basado en sesión, permisos y loading
  useEffect(() => {
    if (loading) {
      setAppState('loading');
    } else if (!session) {
      setAppState('login');
    } else if (!permissions.includes('access_chat')) { 
      setAppState('access_denied');
    } else {
      setAppState('chat');
    }
  }, [loading, session, permissions]);

  const checkApiConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setApiStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      console.log('API no disponible, usando modo simulado');
      setApiStatus('disconnected');
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    return await chatService.sendMessage(message);
  };

  return (
    <div className="w-full h-screen">
      {apiStatus === 'checking' && (
        <div className="bg-yellow-100 text-yellow-800 text-sm p-2 text-center">
          Verificando conexión con la API...
        </div>
      )}
      {apiStatus === 'disconnected' && (
        <div className="bg-orange-100 text-orange-800 text-sm p-2 text-center">
          Modo simulado activado - API no disponible en {API_CONFIG.BASE_URL}
        </div>
      )}
      {apiStatus === 'connected' && (
        <div className="bg-green-100 text-green-800 text-sm p-2 text-center">
          Conectado a la API - {API_CONFIG.BASE_URL}
        </div>
      )}
      {appState === 'loading' && (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-contessa-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando sesión...</p>
          </div>
        </div>
      )}
      {appState === 'login' && <LoginForm />}
      {appState === 'chat' && (
        <Chat onSendMessage={handleSendMessage} />
      )}
      {appState === 'access_denied' && (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l-2.414-2.414a1 1 0 00-.707-.293h-3.172a2 2 0 00-2 2v3m0 0H7a2 2 0 00-2 2v3.586a1 1 0 00.293.707l2.414-2.414A1 1 0 009 10h3m0 0v2m0-4V7a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2h-6a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Acceso Denegado
              </h2>
              <p className="text-gray-600 mb-6">
                No tienes permiso para acceder al chat. Por favor, contacta al instructor para que te otorgue acceso.
              </p>
              <button
                onClick={() => signOut()}
                className="w-full bg-contessa-600 hover:bg-contessa-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;