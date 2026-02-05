'use client';

import { useState, useEffect, useRef } from 'react';
import PageLayout from '../PageLayout';
import { Brain, Settings, MessageSquare, BookOpen, Zap, RefreshCw, Play, Pause, Send, X, Upload, FileText, Edit3, RotateCcw, Check } from 'lucide-react';

interface TestMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Document {
  id: number;
  filename: string;
  file_type: string | null;
  is_indexed: boolean;
  uploaded_at: string;
}

interface Stats {
  activeChats: number;
  messagesToday: number;
  automationRate: number;
  docsCount: number;
}

const DEFAULT_PROMPT = 'Eres un asistente útil y amable para Global Fit Gym. Tu objetivo es ayudar a los usuarios a agendar citas, responder dudas sobre precios y horarios. Usa emojis ocasionalmente. Si no sabes la respuesta, deriva a un humano.';

export default function AIAgentPage() {
  const [isActive, setIsActive] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [aiStatus, setAiStatus] = useState<string>('checking');
  const [stats, setStats] = useState<Stats>({ activeChats: 0, messagesToday: 0, automationRate: 0, docsCount: 0 });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [toggleRespondMessages, setToggleRespondMessages] = useState(true);
  const [toggleUseKnowledgeBase, setToggleUseKnowledgeBase] = useState(true);
  const [toggleInstantReply, setToggleInstantReply] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [promptDirty, setPromptDirty] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptMessage, setPromptMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAiStatus() {
      try {
        const response = await fetch('/api/ai/status');
        if (response.ok) {
          const data = await response.json();
          setAiStatus(data.status);
          setAiConfigured(data.configured);
          setIsActive(data.status === 'active');
        }
      } catch {
        setAiStatus('error');
      }
    }
    checkAiStatus();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/ai/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            activeChats: data.activeChats || 0,
            messagesToday: data.messagesToday || 0,
            automationRate: data.automationRate || 0,
            docsCount: data.docsCount || 0
          });
        }
      } catch {
        setStats({ activeChats: 0, messagesToday: 0, automationRate: 0, docsCount: 0 });
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/ai/knowledge-base');
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch {
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  useEffect(() => {
    async function fetchBotSettings() {
      try {
        const response = await fetch('/api/ai/bot-settings');
        if (response.ok) {
          const data = await response.json();
          const prompt = data.system_prompt || DEFAULT_PROMPT;
          setSystemPrompt(prompt);
          setOriginalPrompt(prompt);
        }
      } catch {
        setSystemPrompt(DEFAULT_PROMPT);
        setOriginalPrompt(DEFAULT_PROMPT);
      }
    }
    fetchBotSettings();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  async function sendTestMessage() {
    if (!testInput.trim() || isTesting) return;

    const userMessage = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTesting(true);

    try {
      const response = await fetch('/api/ai/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setTestMessages(prev => [...prev, { role: 'assistant', text: data.message }]);
        if (data.configured === false) {
          setAiConfigured(false);
        }
      } else {
        setTestMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con la IA.' }]);
      }
    } catch {
      setTestMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión.' }]);
    } finally {
      setIsTesting(false);
    }
  }

  function clearConversation() {
    setTestMessages([]);
  }

  async function refreshDocuments() {
    setDocumentsLoading(true);
    try {
      const response = await fetch('/api/ai/knowledge-base');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch {
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      const response = await fetch('/api/ai/knowledge-base/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, file_type: file.name.split('.').pop() || null })
      });
      if (response.ok) {
        await refreshDocuments();
      }
    } catch {
    }
  }

  async function handleToggle(toggle: string, value: boolean) {
    switch (toggle) {
      case 'respondMessages':
        setToggleRespondMessages(value);
        break;
      case 'useKnowledgeBase':
        setToggleUseKnowledgeBase(value);
        break;
      case 'instantReply':
        setToggleInstantReply(value);
        break;
    }
    try {
      await fetch('/api/ai/bot-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [toggle]: value })
      });
    } catch {
    }
  }

  async function updateLlmEnabled(nextValue: boolean) {
    setIsActive(nextValue);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ is_enabled: nextValue })
      });

      if (!response.ok) {
        setIsActive(!nextValue);
      }
    } catch {
      setIsActive(!nextValue);
    }
  }

  async function saveSystemPrompt() {
    setPromptSaving(true);
    setPromptMessage(null);
    try {
      const response = await fetch('/api/ai/bot-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt })
      });
      if (response.ok) {
        setOriginalPrompt(systemPrompt);
        setPromptDirty(false);
        setPromptMessage({ type: 'success', text: 'Prompt guardado correctamente' });
        setTimeout(() => setPromptMessage(null), 3000);
      } else {
        setPromptMessage({ type: 'error', text: 'Error al guardar el prompt' });
      }
    } catch {
      setPromptMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setPromptSaving(false);
    }
  }

  function restoreDefaultPrompt() {
    setSystemPrompt(DEFAULT_PROMPT);
    setPromptDirty(true);
    setPromptMessage(null);
  }

  function handlePromptChange(value: string) {
    setSystemPrompt(value);
    setPromptDirty(value !== originalPrompt);
    setPromptMessage(null);
  }

  function formatFileSize(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `${days} días`;
  }

  const statsArray = [
    { label: 'Conversaciones Activas', value: statsLoading ? '...' : String(stats.activeChats), icon: MessageSquare },
    { label: 'Mensajes Hoje', value: statsLoading ? '...' : String(stats.messagesToday), icon: Zap },
    { label: 'Respuestas Automatizadas', value: statsLoading ? '...' : `${stats.automationRate}%`, icon: Brain },
    { label: 'Base de Conocimiento', value: statsLoading ? '...' : String(stats.docsCount), icon: BookOpen },
  ];

  return (
    <PageLayout title="Agente IA" description="Configuracion del asistente virtual">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statsArray.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <stat.icon className="text-primary-600 dark:text-primary-400" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Brain className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Estado del Bot</h3>
                    <p className="text-sm text-gray-500">{aiStatus === 'active' ? 'Conectado y activo' : 'No configurado'}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateLlmEnabled(!isActive)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isActive ? <Play size={18} /> : <Pause size={18} />}
                  <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <MessageSquare size={20} className="text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Responder Mensajes</span>
                  </div>
                  <button
                    onClick={() => handleToggle('respondMessages', !toggleRespondMessages)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      toggleRespondMessages
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      toggleRespondMessages ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <BookOpen size={20} className="text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Usar Base de Conocimiento</span>
                  </div>
                  <button
                    onClick={() => handleToggle('useKnowledgeBase', !toggleUseKnowledgeBase)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      toggleUseKnowledgeBase
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      toggleUseKnowledgeBase ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Zap size={20} className="text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Auto-reply Instantaneo</span>
                  </div>
                  <button
                    onClick={() => handleToggle('instantReply', !toggleInstantReply)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      toggleInstantReply
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      toggleInstantReply ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Configuracion del Modelo</h3>
                  <p className="text-sm text-gray-500">Ajustes del LLM</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperatura (Creatividad)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Preciso</span>
                    <span>Balanceado</span>
                    <span>Creativo</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximo de Tokens
                  </label>
                  <input
                    type="number"
                    defaultValue="4096"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col overflow-hidden" style={{ height: '440px' }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Edit3 className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">System Prompt</h3>
                <p className="text-sm text-gray-500">Personalidad e instrucciones del bot</p>
              </div>
            </div>

            <textarea
              value={systemPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm leading-relaxed resize-none overflow-y-auto"
              placeholder="Escribe las instrucciones para el bot..."
            />

            {promptMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                promptMessage.type === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {promptMessage.type === 'success' ? (
                  <span className="flex items-center gap-2"><Check size={16} /> {promptMessage.text}</span>
                ) : (
                  promptMessage.text
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={restoreDefaultPrompt}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                <span>Restaurar Default</span>
              </button>
              <button
                onClick={saveSystemPrompt}
                disabled={!promptDirty || promptSaving}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                  promptDirty && !promptSaving
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {promptSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="lg:w-96 h-fit lg:h-[440px] bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} />
              Probar Prompts
            </h3>
            <button
              onClick={clearConversation}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              title="Limpiar conversacion"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {!aiConfigured && (
            <div className="p-3 mx-4 mt-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                AI no configurado. Agrega una API key en Settings para probar el bot.
              </p>
            </div>
          )}

          <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
            {testMessages.length === 0 && !isTesting && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <MessageSquare size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Escribe un mensaje para comenzar a probar el bot
                </p>
              </div>
            )}
            {testMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`rounded-2xl p-3 text-sm max-w-xs break-words border font-medium ${
                  msg.role === 'user'
                    ? 'bg-blue-500 border-blue-500 text-white rounded-tr-none'
                    : 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTesting && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded-2xl rounded-tl-none p-3 text-sm animate-pulse">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                placeholder="Escribe para probar..."
                disabled={isTesting}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={sendTestMessage}
                disabled={isTesting || !testInput.trim()}
                className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          </div>

          <div className="lg:w-96 lg:h-[440px] bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col overflow-hidden">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                  <BookOpen className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Base de Conocimiento</h3>
                  <p className="text-xs text-gray-500">Documentos y informacion del gym</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center space-x-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer text-xs">
                  <Upload size={16} />
                  <span>Subir</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
                <button
                  onClick={refreshDocuments}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs"
                >
                  <RefreshCw size={16} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {documentsLoading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                  Cargando...
                </div>
              ) : documents.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full">
                  <FileText size={24} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No hay documentos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-2 bg-gray-50 dark:bg-dark-900 rounded-lg flex items-center gap-2">
                      <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 dark:text-red-400 text-xs font-bold">
                          {(doc.file_type || 'FILE').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.uploaded_at)}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                        doc.is_indexed
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {doc.is_indexed ? 'OK' : 'PND'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
