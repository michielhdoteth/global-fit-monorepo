'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../../PageLayout';
import { Plus, Bell, Calendar, Clock, ToggleLeft, ToggleRight, Trash2, Edit, Users, Eye, Play } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ReminderRule {
  id: number;
  name: string;
  description: string | null;
  rule_type: string;
  days_before: number;
  days_after: number;
  template_message: string;
  is_active: boolean;
  send_hour: number;
  targets: RuleTarget[];
  affected_clients_count?: number;
}

interface RuleTarget {
  id: number;
  target_type: string;
  target_value: string | null;
}

interface RulePreview {
  rule_id: number;
  rule_name: string;
  rule_type: string;
  total_affected_clients: number;
  sample_messages: Array<{
    client: string;
    phone: string;
    message: string;
  }>;
}

const ruleTypeLabels: Record<string, string> = {
  birthday: 'Cumpleaños',
  expiry: 'Vencimiento de membresía',
  payment: 'Pago',
  follow_up: 'Seguimiento',
  custom: 'Personalizado',
};

const targetTypeLabels: Record<string, string> = {
  all_clients: 'Todos los clientes',
  specific_plan: 'Plan específico',
  specific_status: 'Estado específico',
};

export default function ReminderRulesPage() {
  const { toast, success, error: showError } = useToast();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [preview, setPreview] = useState<RulePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/reminders/rules');
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

  const fetchPreview = async (ruleId: number) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/reminders/rules/${ruleId}/preview`);
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/reminders/rules/${ruleId}/toggle`, {
        method: 'POST',
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
      const response = await fetch(`/api/reminders/rules/${deleteRuleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        success('Regla eliminada', 'La regla de recordatorio ha sido eliminada');
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

  const generateReminders = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/reminders/rules/${ruleId}/generate`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        success('Recordatorios generados', data.message);
        fetchRules();
      }
    } catch (error) {
      showError('Error', 'No se pudieron generar los recordatorios');
      console.error('Failed to generate reminders:', error);
    }
  };

  const handleRuleCreated = () => {
    setShowNewModal(false);
    setEditingRule(null);
    fetchRules();
  };

  return (
    <PageLayout title="Reglas de Recordatorios" description="Configura recordatorios automáticos para tus clientes">
      <div className="space-y-6">
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Eliminar regla"
          description="¿Estás seguro de que deseas eliminar esta regla? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          variant="destructive"
          onConfirm={deleteRule}
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Bell className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reglas Automáticas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rules.filter(r => r.is_active).length} activa(s) de {rules.length} reglas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all"
          >
            <Plus size={20} />
            <span>Nueva Regla</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
              <Bell className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay reglas de recordatorios configuradas
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg mx-auto transition-all"
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
                className={`bg-white dark:bg-dark-800/50 rounded-2xl border p-6 transition-all ${
                  rule.is_active
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-300 dark:border-gray-600 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${
                      rule.rule_type === 'expiry' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      rule.rule_type === 'birthday' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rule.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.is_active
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {rule.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                      </p>
                      {rule.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchPreview(rule.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors text-gray-500"
                      title="Vista previa"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => generateReminders(rule.id)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600"
                      title="Generar recordatorios"
                    >
                      <Play size={18} />
                    </button>
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
                        rule.is_active
                          ? 'hover:bg-gray-100 dark:hover:bg-dark-700 text-green-600'
                          : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400'
                      }`}
                      title={rule.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {rule.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock size={14} />
                      <span>
                        {rule.days_before > 0 ? `${rule.days_before} días antes` :
                         rule.days_before < 0 ? `${Math.abs(rule.days_before)} días después` :
                         rule.days_after > 0 ? `${rule.days_after} días después` : 'El día del evento'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Calendar size={14} />
                      <span>{rule.send_hour}:00 hs</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Users size={14} />
                      <span>
                        {rule.targets.map(t => targetTypeLabels[t.target_type] || t.target_type).join(', ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono bg-gray-50 dark:bg-dark-900 p-2 rounded-lg truncate">
                    {rule.template_message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {preview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Vista Previa: {preview.rule_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {preview.total_affected_clients} clientes afectados
                </p>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Mensajes de ejemplo:
                </h3>
                {preview.sample_messages.map((msg, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white">{msg.client}</p>
                    <p className="text-xs text-gray-500 mb-2">{msg.phone}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {(showNewModal || editingRule) && (
          <RuleModal
            rule={editingRule}
            onClose={() => {
              setShowNewModal(false);
              setEditingRule(null);
            }}
            onSave={handleRuleCreated}
          />
        )}
      </div>
    </PageLayout>
  );
}

function RuleModal({ rule, onClose, onSave }: { rule: ReminderRule | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [ruleType, setRuleType] = useState(rule?.rule_type || 'custom');
  const [daysBefore, setDaysBefore] = useState(rule?.days_before || 0);
  const [daysAfter, setDaysAfter] = useState(rule?.days_after || 0);
  const [sendHour, setSendHour] = useState(rule?.send_hour || 9);
  const [templateMessage, setTemplateMessage] = useState(rule?.template_message || '');
  const [targetType, setTargetType] = useState(rule?.targets[0]?.target_type || 'all_clients');
  const [targetValue, setTargetValue] = useState(rule?.targets[0]?.target_value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ruleData = {
      name,
      description,
      rule_type: ruleType,
      days_before: daysBefore,
      days_after: daysAfter,
      send_hour: sendHour,
      template_message: templateMessage,
      targets: [{
        target_type: targetType,
        target_value: targetType !== 'all_clients' ? targetValue : null
      }]
    };

    const url = rule ? `/api/reminders/rules/${rule.id}` : '/api/reminders/rules';
    const method = rule ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        onSave();
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
            {rule ? 'Editar Regla' : 'Nueva Regla de Recordatorio'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configura cuándo y a quién enviar recordatorios automáticos
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
              placeholder="Ej: Recordatorio de cumpleaños"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué hace esta regla..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de recordatorio
            </label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="expiry">Vencimiento de membresía</option>
              <option value="birthday">Cumpleaños</option>
              <option value="payment">Pago</option>
              <option value="follow_up">Seguimiento</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días antes
              </label>
              <input
                type="number"
                value={daysBefore}
                onChange={(e) => setDaysBefore(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">0 = el día del evento</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días después
              </label>
              <input
                type="number"
                value={daysAfter}
                onChange={(e) => setDaysAfter(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hora de envío
            </label>
            <select
              value={sendHour}
              onChange={(e) => setSendHour(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aplicar a
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all_clients">Todos los clientes</option>
              <option value="specific_plan">Plan específico</option>
              <option value="specific_status">Estado específico</option>
            </select>
          </div>

          {targetType !== 'all_clients' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {targetType === 'specific_plan' ? 'Nombre del plan' : 'Estado'}
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={targetType === 'specific_plan' ? 'Ej: Premium, Basic' : 'Ej: ACTIVE, PENDING'}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              placeholder="Hola {nombre}, te recordamos que tu membresía..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {'{nombre}'}, {'{plan}'}, {'{membership_expiry}'} para personalización
            </p>
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
              disabled={isSubmitting || !name || !templateMessage}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
