'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Smile, Send as SendIcon, Loader2, AlertCircle } from 'lucide-react';

interface ChatThread {
  id: number;
  user: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  time: string;
  online: boolean;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
}

export default function ChatsPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchThreads() {
      try {
        const response = await fetch('/api/frontend/chats/threads');
        if (!response.ok) throw new Error('Failed to fetch chat threads');
        const data = await response.json();
        setThreads(data);
        if (data.length > 0) {
          setSelectedThreadId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoadingThreads(false);
      }
    }
    fetchThreads();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (!selectedThreadId) return;

      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/frontend/chats/messages?thread_id=${selectedThreadId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [selectedThreadId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThreadId) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/frontend/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThreadId,
          content: messageInput,
          sender_name: 'Agent',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessageInput('');
      // Fetch updated messages
      const messagesResponse = await fetch(`/api/frontend/chats/messages?thread_id=${selectedThreadId}`);
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const filteredThreads = threads.filter(t =>
    t.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout title="Chats" description="Conversaciones en tiempo real">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}
      <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingThreads && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Cargando conversaciones...
              </div>
            )}
            {!loadingThreads && threads.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No se encontraron conversaciones
              </div>
            )}
            {!loadingThreads && filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/50 ${
                  selectedThreadId === thread.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                      {thread.avatar}
                    </div>
                    {thread.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-800"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{thread.user}</p>
                      <span className="text-xs text-gray-500">{thread.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{thread.lastMessage || 'Sin mensajes'}</p>
                  </div>
                  {thread.unread > 0 && (
                    <span className="h-5 w-5 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center">
                      {thread.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                    {selectedThread.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedThread.user}</p>
                    <p className={`text-xs flex items-center space-x-1 ${selectedThread.online ? 'text-green-500' : 'text-gray-500'}`}>
                      <span className={`h-2 w-2 rounded-full ${selectedThread.online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      <span>{selectedThread.online ? 'En linea' : 'Sin conexion'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <Phone size={20} className="text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <Video size={20} className="text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <MoreVertical size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                  </div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Sin mensajes
                  </div>
                )}
                {!loadingMessages && messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'me'
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <Paperclip size={20} className="text-gray-500" />
                  </button>
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <Smile size={20} className="text-gray-500" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <SendIcon size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">Selecciona una conversacion</p>
                <p className="text-sm mt-2">Elige una conversacion para empezar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
