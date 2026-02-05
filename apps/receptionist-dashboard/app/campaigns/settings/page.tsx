'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../../PageLayout';
import { Plus, Zap, Calendar, Clock, ToggleLeft, ToggleRight, Trash2, Edit, Users, Eye, Play, X, Save, Loader2, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CampaignRule {
  id: number;
  name: string;
  description: string | null;
  rule_type: string;
  trigger_event: string;
  template_content: string;
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
  sample_campaigns: Array<{
    client: string;
    email: string;
    content_preview: string;
  }>;
}

const ruleTypeLabels: Record<string, string> = {
  onboarding: 'Bienvenida',
  monthly: 'Mensual',
  seasonal: 'Estacional',
  promotional: 'Promocional',
  retention: 'Retención',
  custom: 'Personalizado',
};

const triggerLabels: Record<string, string> = {
  client_signup: 'Nuevo cliente',
  membership_expiry: 'Vencimiento de membresía',
  inactivity: 'Inactividad',
  payment_due: 'Pago vencido',
  milestone: 'Hito',
  manual: 'Manual',
};

const targetTypeLabels: Record<string, string> = {
  all_clients: 'Todos los clientes',
  specific_plan: 'Plan específico',
  specific_status: 'Estado específico',
};

export default function CampaignRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<CampaignRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CampaignRule | null>(null);
  const [preview, setPreview] = useState<RulePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'custom',
    trigger_event: 'manual',
    template_content: '',
    send_hour: 9,
    targets: [{ target_type: 'all_clients', target_value: null as string | null }],
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/campaigns/rules');
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
      const response = await fetch(`/api/campaigns/rules/${ruleId}/preview`);
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
      const response = await fetch(`/api/campaigns/rules/${ruleId}/toggle`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchRules();
        setSuccessMessage('Regla actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Error actualizando la regla');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const deleteRule = async () => {
    if (deleteRuleId === null) return;
    try {
      const response = await fetch(`/api/campaigns/rules/${deleteRuleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Regla eliminada', 'La regla ha sido eliminada exitosamente');
        fetchRules();
      }
    } catch (error) {
      toast.error('Error', 'No se pudo eliminar la regla');
    } finally {
      setDeleteRuleId(null);
      setShowDeleteDialog(false);
    }
  };

  const openDeleteDialog = (ruleId: number) => {
    setDeleteRuleId(ruleId);
    setShowDeleteDialog(true);
  };

  const handleSaveRule = async () => {
    if (!formData.name.trim() || !formData.template_content.trim()) {
      setErrorMessage('Por favor completa todos los campos requeridos');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const url = editingRule ? `/api/campaigns/rules/${editingRule.id}` : '/api/campaigns/rules';
      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchRules();
        setShowNewModal(false);
        resetForm();
        setSuccessMessage(editingRule ? 'Regla actualizada' : 'Regla creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Error guardando la regla');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error guardando la regla');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'custom',
      trigger_event: 'manual',
      template_content: '',
      send_hour: 9,
      targets: [{ target_type: 'all_clients', target_value: null }],
    });
    setEditingRule(null);
  };

  const handleEditRule = (rule: CampaignRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      trigger_event: rule.trigger_event,
      template_content: rule.template_content,
      send_hour: rule.send_hour,
      targets: rule.targets.map(t => ({ target_type: t.target_type, target_value: t.target_value })),
    });
    setShowNewModal(true);
  };

  const handleCloseModal = () => {
    setShowNewModal(false);
    setPreview(null);
    resetForm();
  };

  return (
    <PageLayout title="Reglas de Campanas" description="Configura reglas automaticas para crear campanas">
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

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reglas de Campanas Automaticas</h2>
          <button
            onClick={() => {
              resetForm();
              setShowNewModal(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all"
          >
            <Plus size={20} />
            <span>Nueva Regla</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-dark-800 rounded-2xl">
            <Zap size={40} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay reglas configuradas</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Crea tu primera regla para automatizar campanas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {triggerLabels[rule.trigger_event] || rule.trigger_event}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{rule.send_hour}:00</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{rule.affected_clients_count || 0} clientes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => fetchPreview(rule.id)}
                      disabled={previewLoading}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Ver vista previa"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="p-2 transition-colors"
                      title={rule.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {rule.is_active ? (
                        <ToggleRight size={20} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={20} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openDeleteDialog(rule.id)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {preview && preview.rule_id === rule.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Vista Previa</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Afectaria a {preview.total_affected_clients} clientes
                    </p>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {preview.sample_campaigns.map((campaign, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-dark-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{campaign.client}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{campaign.email}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {campaign.content_preview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New/Edit Rule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRule ? 'Editar Regla' : 'Nueva Regla de Campana'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Regla
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Bienvenida de nuevos clientes"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripcion
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describir la regla..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Regla
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  >
                    {Object.entries(ruleTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evento Disparador
                  </label>
                  <select
                    value={formData.trigger_event}
                    onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  >
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Envio
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.send_hour}
                  onChange={(e) => setFormData({ ...formData, send_hour: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contenido de la Campana
                </label>
                <textarea
                  value={formData.template_content}
                  onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                  placeholder="Contenido del mensaje o campana..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isLoading ? 'Guardando...' : 'Guardar Regla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
