import React, { useState, useEffect } from 'react';
import { Chat } from './components/Chat';
import { ChatService } from './services/chatService';
import { API_CONFIG } from './config/api';

const chatService = new ChatService();

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Verificar conexión con la API al iniciar
    checkApiConnection();
  }, []);

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
      <Chat onSendMessage={handleSendMessage} />
    </div>
  );
}

export default App;