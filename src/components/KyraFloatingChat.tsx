import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { kyraAI } from '../services/kyra';
import { AIMessage } from '../types';

export default function KyraFloatingChat() {
  const { state, dispatch } = useApp();
  const { aiMessages, agencies, properties, settings } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_AI_MESSAGE', payload: userMessage });
    setInput('');
    setIsLoading(true);

    try {
      const response = await kyraAI.generateResponse(input, { agencies, properties });
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: aiMessage });
    } catch (error) {
      console.error('Kyra AI error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
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

  const translations = {
    en: {
      chatWithKyra: 'Chat with Kyra',
      kyraAI: 'Kyra AI Assistant',
      typeMessage: 'Type your message...',
      send: 'Send',
      minimize: 'Minimize',
      maximize: 'Maximize',
      close: 'Close',
      welcomeMessage: 'Hello! I\'m Kyra, your real estate advisor. I have extensive experience in property analysis and market trends. I can help you analyze properties, evaluate investment opportunities, and provide market insights. What would you like to know?'
    },
    cz: {
      chatWithKyra: 'Chat s Kyrou',
      kyraAI: 'Kyra AI Asistent',
      typeMessage: 'Napište zprávu...',
      send: 'Odeslat',
      minimize: 'Minimalizovat',
      maximize: 'Maximalizovat',
      close: 'Zavřít',
      welcomeMessage: 'Dobrý den! Jsem Kyra, vaše realitní poradkyně. Mám dlouholeté zkušenosti s analýzou nemovitostí a znalostí trhu. Můžu vám pomoct s hodnocením properties, investičními příležitostmi a tržními insights. Co vás zajímá?'
    },
    ru: {
      chatWithKyra: 'Чат с Kyra',
      kyraAI: 'Kyra AI Ассистент',
      typeMessage: 'Введите сообщение...',
      send: 'Отправить',
      minimize: 'Свернуть',
      maximize: 'Развернуть',
      close: 'Закрыть',
      welcomeMessage: 'Привет! Я Kyra, ваш AI ассистент. Я могу помочь анализировать недвижимость, генерировать отчеты и навигировать по приложению. Как я могу помочь?'
    },
    fr: {
      chatWithKyra: 'Chat avec Kyra',
      kyraAI: 'Kyra Assistant IA',
      typeMessage: 'Tapez votre message...',
      send: 'Envoyer',
      minimize: 'Réduire',
      maximize: 'Agrandir',
      close: 'Fermer',
      welcomeMessage: 'Bonjour! Je suis Kyra, votre assistant IA. Je peux vous aider à analyser les propriétés, générer des rapports et naviguer dans l\'application. Comment puis-je vous aider?'
    },
  };

  const t = translations[settings.language];

  // Show welcome message if no messages exist
  useEffect(() => {
    if (aiMessages.length === 0 && isOpen) {
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        content: t.welcomeMessage,
        sender: 'ai',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: welcomeMessage });
    }
  }, [isOpen, aiMessages.length, dispatch, t.welcomeMessage]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        >
          <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {t.chatWithKyra}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t.kyraAI}</h3>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isMinimized ? t.maximize : t.minimize}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm border'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.typeMessage}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}