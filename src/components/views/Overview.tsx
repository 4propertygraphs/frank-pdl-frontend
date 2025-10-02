import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { cloudUploadService } from "../../services/cloudUpload";
import { Building, Users, DollarSign, TrendingUp, Upload, Cloud, Loader2, MessageSquare, Plus, Trash2, Send } from "lucide-react";
import { kyraService } from "../../services/kyra";

interface DBStats {
  totalProperties: number;
  activeAgencies: number;
  avgPrice: number;
  totalValue: number;
  allAgencies: Array<{ name: string; count: number; avgPrice: number }>;
}

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

export default function Overview() {
  const { state } = useApp();
  const { settings } = state;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    loadAllStats();
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../../services/supabase');

      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true);

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (agenciesError || propertiesError) {
        console.error('Error loading data:', agenciesError || propertiesError);
        setLoading(false);
        return;
      }

      const activeAgencies = agencies?.filter(a => a.property_count > 0) || [];
      const allProperties = properties || [];

      const totalValue = allProperties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
      const avgPrice = allProperties.length > 0 ? Math.round(totalValue / allProperties.length) : 0;

      const allAgencies = activeAgencies
        .map(a => {
          const agencyProps = allProperties.filter(p => p.agency_id === a.agency_id);
          const agencyTotal = agencyProps.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
          const agencyAvg = agencyProps.length > 0 ? Math.round(agencyTotal / agencyProps.length) : 0;
          return {
            name: a.name,
            count: agencyProps.length,
            avgPrice: agencyAvg
          };
        })
        .filter(a => a.count > 0)
        .sort((a, b) => b.count - a.count);

      setStats({
        totalProperties: allProperties.length,
        activeAgencies: activeAgencies.length,
        avgPrice,
        totalValue,
        allAgencies
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setLoading(false);
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

      await loadAllStats();

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
      title: "Dashboard Overview",
      subtitle: "Real-time insights into your property portfolio",
    },
    cz: {
      title: "Přehled dashboard",
      subtitle: "Poznatky v reálném čase o vašem portfoliu nemovitostí",
    },
  };

  const t = translations[settings.language as "en" | "cz"] || translations.en;

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No data available</h2>
          <p className="text-gray-500 mt-2">Click "Sync All to Cloud" to load properties</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Total Properties",
      value: stats.totalProperties.toLocaleString(),
      icon: Building,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Active Agencies",
      value: stats.activeAgencies.toString(),
      icon: Users,
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Average Price",
      value: `€${stats.avgPrice.toLocaleString()}`,
      icon: DollarSign,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Total Value",
      value: `€${stats.totalValue.toLocaleString()}`,
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
  ];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          All Agencies
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Agency Name</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Properties</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Average Price</th>
              </tr>
            </thead>
            <tbody>
              {stats.allAgencies.map((agency, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-900 font-medium">{agency.name}</td>
                  <td className="py-3 px-4 text-right text-blue-600 font-semibold">{agency.count}</td>
                  <td className="py-3 px-4 text-right text-gray-700">€{agency.avgPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: '600px' }}>
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
