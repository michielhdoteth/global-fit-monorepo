'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Tag, ToggleLeft, ToggleRight, Trash2, Edit, Hash } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface KeywordRule {
  id: number;
  name: string;
  keywords: string[];
  match_type: string;
  response_type: string;
  response_content: { body: string };
  priority: number;
  is_enabled: boolean;
  case_sensitive: boolean;
  created_at: string;
}

const matchTypeLabels: Record<string, string> = {
  exact: 'Exacto',
  contains: 'Contiene',
  starts_with: 'Comienza con',
  regex: 'Regex',
};

const responseTypeLabels: Record<string, string> = {
  text: 'Texto',
  transfer: 'Transferir',
  flow: 'Flujo',
};

const responseTypeColors: Record<string, string> = {
  text: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  flow: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function KeywordRulesPage() {
  const { toast, success, error: showError } = useToast();
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingRule, setEditingRule] = useState<KeywordRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/keyword-rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = async (ruleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/keyword-rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const deleteRule = async () => {
    if (deleteRuleId === null) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/keyword-rules/${deleteRuleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        success('Regla eliminada', 'La regla de palabras clave ha sido eliminada');
        fetchRules();
      }
    } catch (error) {
      showError('Error', 'No se pudo eliminar la regla');
      console.error('Failed to delete rule:', error);
    } finally {
      setDeleteRuleId(null);
      setShowDeleteDialog(false);
    }
  };

  const openDeleteDialog = (ruleId: number) => {
    setDeleteRuleId(ruleId);
    setShowDeleteDialog(true);
  };

  const handleRuleSaved = () => {
    setShowNewModal(false);
    setEditingRule(null);
    fetchRules();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 p-6">
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar regla"
        description="¿Estás seguro de que deseas eliminar esta regla? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={deleteRule}
      />

      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reglas de Palabras Clave</h1>
          <p className="text-gray-600 dark:text-gray-400">Configura respuestas automáticas basadas en palabras clave</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reglas de Chatbot
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rules.filter(r => r.is_enabled).length} activa(s) de {rules.length} reglas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>Nueva Regla</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
              <Tag className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay reglas de palabras clave configuradas
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mx-auto transition-all"
            >
              <Plus size={16} />
              <span>Crear Primera Regla</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-white dark:bg-dark-800 rounded-2xl border p-6 transition-all ${
                  rule.is_enabled
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-300 dark:border-gray-600 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-xl ${responseTypeColors[rule.response_type] || 'bg-gray-100'}`}>
                      <Hash size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rule.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.is_enabled
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {rule.is_enabled ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.response_type === 'transfer'
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {responseTypeLabels[rule.response_type] || rule.response_type}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {rule.keywords.slice(0, 5).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                        {rule.keywords.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md text-sm">
                            +{rule.keywords.length - 5} más
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tipo: {matchTypeLabels[rule.match_type] || rule.match_type}
                          {rule.case_sensitive && ' • Distingue mayúsculas'}
                          {` • Prioridad: ${rule.priority}`}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-900 p-2 rounded-lg">
                          {rule.response_content?.body || 'Sin respuesta'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors text-gray-500"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(rule.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.is_enabled
                          ? 'hover:bg-gray-100 dark:hover:bg-dark-700 text-green-600'
                          : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400'
                      }`}
                      title={rule.is_enabled ? 'Desactivar' : 'Activar'}
                    >
                      {rule.is_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showNewModal || editingRule) && (
        <RuleModal
          rule={editingRule}
          onClose={() => {
            setShowNewModal(false);
            setEditingRule(null);
          }}
          onSave={handleRuleSaved}
        />
      )}
    </div>
  );
}

function RuleModal({ rule, onClose, onSave }: { rule: KeywordRule | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(rule?.name || '');
  const [keywords, setKeywords] = useState(rule?.keywords.join(', ') || '');
  const [matchType, setMatchType] = useState(rule?.match_type || 'contains');
  const [responseType, setResponseType] = useState(rule?.response_type || 'text');
  const [responseBody, setResponseBody] = useState(rule?.response_content?.body || '');
  const [priority, setPriority] = useState(rule?.priority || 100);
  const [caseSensitive, setCaseSensitive] = useState(rule?.case_sensitive || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

    const ruleData = {
      name,
      keywords: keywordsArray,
      match_type: matchType,
      response_type: responseType,
      response_content: { body: responseBody },
      priority,
      case_sensitive: caseSensitive,
    };

    const url = rule ? `/api/ai/keyword-rules/${rule.id}` : '/api/ai/keyword-rules';
    const method = rule ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        console.error('Failed to save rule:', error);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {rule ? 'Editar Regla' : 'Nueva Regla de Palabras Clave'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configura palabras clave y respuestas automáticas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la regla
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Horarios, Precios, Clases"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Palabras clave (separadas por coma)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ej: horario, hora, abierto, cuándo"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de coincidencia
              </label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="contains">Contiene</option>
                <option value="exact">Exacto</option>
                <option value="starts_with">Comienza con</option>
                <option value="regex">Regex</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de respuesta
              </label>
              <select
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="text">Texto</option>
                <option value="transfer">Transferir a humano</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
                min={1}
                max={999}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Mayor valor = mayor prioridad</p>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Distingue mayúsculas</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Respuesta
            </label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              placeholder="Escribe la respuesta del chatbot..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name || !keywords || !responseBody}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
