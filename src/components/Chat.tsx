import React, { useState, useRef, useEffect } from 'react';
import { Send, Baby } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatProps {
  onSendMessage: (message: string) => Promise<string>;
}

export const Chat: React.FC<ChatProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy Sarha, tu asistente de maternidad. Estoy para ayudarte con todas tus dudas sobre embarazo, nacimiento y puerperio. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(currentMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-contessa-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-pink-400 to-contessa-500 rounded-full">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sarha</h1>
            <p className="text-sm text-gray-600">Tu asistente en maternidad</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`max-w-xs md:max-w-md lg:max-w-lg`}>
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.isUser
                    ? 'bg-gradient-to-r from-contessa-400 to-purple-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-2">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-xs md:max-w-md lg:max-w-lg">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-md border-t border-pink-100 px-4 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta sobre embarazo, parto o puerperio..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
              rows={1}
              style={{ minHeight: '50px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="p-4 bg-gradient-to-r from-purple-400 to-contessa-400 text-white rounded-full hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md self-center"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};