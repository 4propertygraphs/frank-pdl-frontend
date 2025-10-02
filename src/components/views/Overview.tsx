import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { cloudUploadService } from "../../services/cloudUpload";
import { Upload, Cloud, Loader2, MessageSquare, Plus, Trash2, Send, Building, Users, DollarSign, Clock } from "lucide-react";
import { kyraService } from "../../services/kyra";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Stats {
  totalProperties: number;
  totalAgencies: number;
  avgPrice: number;
  lastUpdate: string;
}

export default function Overview() {
  const { state } = useApp();
  const { settings } = state;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const { supabase } = await import('../../services/supabase');

      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('price');

      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('id')
        .eq('is_active', true);

      if (propsError || agenciesError) {
        console.error('Error loading stats:', propsError || agenciesError);
        setLoadingStats(false);
        return;
      }

      const totalProperties = properties?.length || 0;
      const totalAgencies = agencies?.length || 0;
      const totalValue = properties?.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) || 0;
      const avgPrice = totalProperties > 0 ? Math.round(totalValue / totalProperties) : 0;

      const lastUpdate = localStorage.getItem('lastAutoSync');
      const lastUpdateDate = lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'Never';

      setStats({
        totalProperties,
        totalAgencies,
        avgPrice,
        lastUpdate: lastUpdateDate
      });
      setLoadingStats(false);
    } catch (err) {
      console.error('Error loading stats:', err);
      setLoadingStats(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('kyra_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      setLoadingConversations(false);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('kyra_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('kyra_conversations')
        .insert({ title: 'New Conversation' })
        .select()
        .single();

      if (error) throw error;
      setConversations([data, ...conversations]);
      setCurrentConversation(data);
      setMessages([]);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('kyra_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    let conversation = currentConversation;

    if (!conversation) {
      try {
        const { supabase } = await import('../../services/supabase');
        const { data, error } = await supabase
          .from('kyra_conversations')
          .insert({ title: inputMessage.substring(0, 50) })
          .select()
          .single();

        if (error) throw error;
        conversation = data;
        setCurrentConversation(data);
        setConversations([data, ...conversations]);
      } catch (err) {
        console.error('Error creating conversation:', err);
        return;
      }
    }

    const userMessage = inputMessage;
    setInputMessage("");
    setIsSending(true);

    try {
      const { supabase } = await import('../../services/supabase');

      const { data: userMsg, error: userError } = await supabase
        .from('kyra_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage
        })
        .select()
        .single();

      if (userError) throw userError;
      setMessages(prev => [...prev, userMsg]);

      const response = await kyraService.chat(userMessage);

      const { data: assistantMsg, error: assistantError } = await supabase
        .from('kyra_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: response
        })
        .select()
        .single();

      if (assistantError) throw assistantError;
      setMessages(prev => [...prev, assistantMsg]);

      await supabase
        .from('kyra_conversations')
        .update({
          updated_at: new Date().toISOString(),
          title: conversations.find(c => c.id === conversation.id)?.title === 'New Conversation'
            ? userMessage.substring(0, 50)
            : conversations.find(c => c.id === conversation.id)?.title
        })
        .eq('id', conversation.id);

      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadToCloud = async () => {
    if (isUploading) return;

    const confirmed = window.confirm('This will sync all XML files to Supabase. Continue?');
    if (!confirmed) return;

    setIsUploading(true);
    setUploadProgress('Uploading properties to Supabase...');

    try {
      const result = await cloudUploadService.uploadAllXMLFiles();
      localStorage.setItem('lastAutoSync', Date.now().toString());
      setUploadProgress(`✅ Sync complete: ${result.success} uploaded, ${result.failed} failed`);

      await loadStats();

      setTimeout(() => {
        setUploadProgress("");
        setIsUploading(false);
      }, 3000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadProgress(`❌ Upload failed: ${error.message}`);
      setTimeout(() => {
        setUploadProgress("");
        setIsUploading(false);
      }, 5000);
    }
  };

  const translations = {
    en: {
      title: "Kyra Assistant",
      subtitle: "Your AI-powered property management assistant",
    },
    cz: {
      title: "Kyra Asistent",
      subtitle: "Váš AI asistent pro správu nemovitostí",
    },
  };

  const t = translations[settings.language as "en" | "cz"] || translations.en;

  const statCards = [
    {
      title: "Total Properties",
      value: loadingStats ? "..." : stats?.totalProperties.toLocaleString() || "0",
      icon: Building,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Active Agencies",
      value: loadingStats ? "..." : stats?.totalAgencies.toString() || "0",
      icon: Users,
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Average Price",
      value: loadingStats ? "..." : `€${stats?.avgPrice.toLocaleString() || "0"}`,
      icon: DollarSign,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Last Update",
      value: loadingStats ? "..." : stats?.lastUpdate || "Never",
      icon: Clock,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
  ];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {uploadProgress && (
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
              {uploadProgress}
            </div>
          )}
          <button
            onClick={handleUploadToCloud}
            disabled={isUploading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
              isUploading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {isUploading ? (
              <>
                <Cloud className="w-5 h-5 animate-pulse" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Sync All to Cloud
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: 'calc(100vh - 420px)', minHeight: '500px' }}>
        <div className="flex h-full">
          <div className="w-64 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setCurrentConversation(conv)}
                      className={`group flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                        currentConversation?.id === conv.id
                          ? 'bg-blue-100 border border-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Kyra Assistant
              </h3>
              <p className="text-sm text-gray-500">Ask me anything about your properties</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Start a conversation with Kyra</p>
                    <p className="text-sm mt-2">Try asking:</p>
                    <div className="mt-4 space-y-2 text-left max-w-md mx-auto">
                      <div className="bg-white p-3 rounded-lg border text-gray-600 text-sm">
                        "How many properties do we have?"
                      </div>
                      <div className="bg-white p-3 rounded-lg border text-gray-600 text-sm">
                        "Show me the top agencies"
                      </div>
                      <div className="bg-white p-3 rounded-lg border text-gray-600 text-sm">
                        "What's the market trend?"
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border shadow-sm text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="max-w-2xl px-4 py-3 rounded-2xl bg-white border shadow-sm">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !inputMessage.trim()}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    isSending || !inputMessage.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
