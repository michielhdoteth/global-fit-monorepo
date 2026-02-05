'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Save, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Eye, EyeOff, Users, Plus, Edit, Trash2, X, Check, Download } from 'lucide-react';

interface IntegrationSettings {
  evo?: {
    configured?: boolean;
    dns: string;
    api_key: string;
    api_key_masked?: string;
    ai_api_key?: string;
    ai_api_key_masked?: string;
    branch_id?: string;
    is_enabled: boolean;
  };
  kapso?: {
    configured?: boolean;
    api_key: string;
    webhook_secret: string;
    whatsapp_number: string;
    base_url?: string;
    is_enabled: boolean;
  };
  llm?: {
    configured?: boolean;
    provider: string;
    api_key: string;
    api_key_masked?: string;
    model: string;
    base_url?: string;
    temperature?: number;
    max_tokens?: number;
    is_enabled: boolean;
  };
  wechaty?: {
    is_enabled: boolean;
  };
}

interface IntegrationExpandedState {
  [key: string]: boolean;
}

interface ShowPasswordState {
  [key: string]: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [integrations, setIntegrations] = useState<IntegrationSettings>({});
  const [expandedIntegrations, setExpandedIntegrations] = useState<IntegrationExpandedState>({});
  const [showPasswords, setShowPasswords] = useState<ShowPasswordState>({});
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Users & Teams state
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Data management state
  const [backupSettings, setBackupSettings] = useState<any>({
    isEnabled: false,
    frequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    lastBackupAt: null,
    nextScheduledAt: null,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['clients', 'appointments']);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchIntegrationSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users-teams') {
      fetchUsers();
      fetchTeams();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'data') {
      fetchBackupSettings();
    }
  }, [activeTab]);

  const fetchIntegrationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [evoRes, kapsoRes, llmRes] = await Promise.all([
        fetch('/api/evo/status', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/settings/kapso', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/settings/llm', { headers }).then(r => r.json()).catch(() => null),
      ]);

      setIntegrations({
        evo: evoRes?.configured ? {
          dns: evoRes.dns || '',
          api_key: '',
          api_key_masked: evoRes.api_key_masked || '',
          ai_api_key: '',
          ai_api_key_masked: evoRes.ai_api_key_masked || '',
          branch_id: evoRes.branch_id || '',
          is_enabled: evoRes.enabled,
          configured: evoRes.configured
        } : { dns: '', api_key: '', ai_api_key: '', branch_id: '', is_enabled: false, configured: false },

        kapso: kapsoRes && kapsoRes.configured ? {
          api_key: '',
          webhook_secret: '',
          whatsapp_number: kapsoRes.whatsapp_number || '',
          base_url: kapsoRes.base_url || 'https://api.kapso.ai',
          is_enabled: kapsoRes.enabled
        } : { api_key: '', webhook_secret: '', whatsapp_number: '', base_url: 'https://api.kapso.ai', is_enabled: false },

        llm: llmRes?.configured ? {
          provider: llmRes.provider || 'deepseek',
          api_key: '',
          api_key_masked: llmRes.api_key_masked || '',
          model: llmRes.model || 'gpt-5.2-nano',
          base_url: llmRes.base_url || 'https://api.deepseek.com',
          temperature: llmRes.temperature || 0.7,
          max_tokens: llmRes.max_tokens || 1000,
          is_enabled: llmRes.enabled,
          configured: llmRes.configured
        } : { provider: 'deepseek', api_key: '', model: 'gpt-5.2-nano', base_url: 'https://api.deepseek.com', temperature: 0.7, max_tokens: 1000, is_enabled: false, configured: false },

        wechaty: { is_enabled: false }
      });
    } catch (error) {
      console.error('Error fetching integration settings:', error);
    }
  };

  const handleIntegrationChange = (integration: string, field: string, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration as keyof IntegrationSettings],
        [field]: value
      }
    }));
  };

  const saveIntegration = async (integration: string) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let endpoint = '';
      let payload: any = {};

      if (integration === 'evo') {
        endpoint = '/api/evo/configure';
        payload = integrations.evo
          ? {
              dns: integrations.evo.dns,
              api_key: integrations.evo.api_key,
              ai_api_key: integrations.evo.ai_api_key,
              branch_id: integrations.evo.branch_id,
              is_enabled: integrations.evo.is_enabled,
            }
          : {};
      } else if (integration === 'kapso') {
        endpoint = '/api/settings/kapso';
        payload = integrations.kapso
          ? {
              api_key: integrations.kapso.api_key,
              webhook_secret: integrations.kapso.webhook_secret,
              whatsapp_number: integrations.kapso.whatsapp_number,
              base_url: integrations.kapso.base_url,
              is_enabled: integrations.kapso.is_enabled,
            }
          : {};
      } else if (integration === 'llm') {
        endpoint = '/api/settings/llm';
        payload = integrations.llm
          ? {
              provider: integrations.llm.provider,
              api_key: integrations.llm.api_key,
              model: integrations.llm.model,
              base_url: integrations.llm.base_url,
              temperature: integrations.llm.temperature,
              max_tokens: integrations.llm.max_tokens,
              is_enabled: integrations.llm.is_enabled,
            }
          : {};
      }

      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Failed to save ${integration} settings (HTTP ${response.status})`);
      }

      setSuccessMessage(`${integration.toUpperCase()} settings saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error saving settings';
      setErrorMessage(errorMsg);
      console.error(`Error saving ${integration}:`, errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const testIntegration = async (integration: string) => {
    setTestingIntegration(integration);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let endpoint = '';
      let payload: any = {};

      if (integration === 'evo') {
        endpoint = '/api/evo/test';
        payload = integrations.evo
          ? {
              dns: integrations.evo.dns,
              api_key: integrations.evo.api_key,
              ai_api_key: integrations.evo.ai_api_key,
              branch_id: integrations.evo.branch_id,
              is_enabled: integrations.evo.is_enabled,
            }
          : {};
      } else if (integration === 'kapso') {
        endpoint = '/api/settings/kapso';
        payload = integrations.kapso
          ? {
              api_key: integrations.kapso.api_key,
              webhook_secret: integrations.kapso.webhook_secret,
              whatsapp_number: integrations.kapso.whatsapp_number,
              base_url: integrations.kapso.base_url,
              is_enabled: integrations.kapso.is_enabled,
            }
          : {};
      } else if (integration === 'llm') {
        endpoint = '/api/settings/llm/test';
        payload = integrations.llm
          ? {
              provider: integrations.llm.provider,
              api_key: integrations.llm.api_key,
              model: integrations.llm.model,
              base_url: integrations.llm.base_url,
              temperature: integrations.llm.temperature,
              max_tokens: integrations.llm.max_tokens,
              is_enabled: integrations.llm.is_enabled,
            }
          : {};
      }

      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Connection test failed`);
      }

      setSuccessMessage(`${integration.toUpperCase()} connection successful!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : `Connection test failed`;
      setErrorMessage(errorMsg);
      console.error(`Error testing ${integration}:`, errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setTestingIntegration(null);
    }
  };

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Fetch Users & Teams
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // User CRUD handlers
  const handleCreateUser = async (userData: any) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
      }

      setSuccessMessage('Usuario creado exitosamente!');
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error creating user');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
      }
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const error = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        }
        throw new Error(error.detail || 'Failed to update user');
      }

      setSuccessMessage('Usuario actualizado exitosamente!');
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error updating user');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Estas seguro de que deseas desactivar este usuario?')) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
      }
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const error = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción. Se requiere rol de Admin o Super Admin.');
        }
        throw new Error(error.detail || 'Failed to deactivate user');
      }

      setSuccessMessage('Usuario desactivado exitosamente!');
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error deactivating user');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Team CRUD handlers
  const handleCreateTeam = async (teamData: any) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create team');
      }

      setSuccessMessage('Equipo creado exitosamente!');
      setShowTeamModal(false);
      setEditingTeam(null);
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error creating team');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeam = async (teamId: number, teamData: any) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/settings/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update team');
      }

      setSuccessMessage('Equipo actualizado exitosamente!');
      setShowTeamModal(false);
      setEditingTeam(null);
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error updating team');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Estas seguro de que deseas eliminar este equipo?')) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/settings/teams/${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete team');
      }

      setSuccessMessage('Equipo eliminado exitosamente!');
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error deleting team');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Data management functions
  const fetchBackupSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBackupSettings(data);
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          format: exportFormat,
          dataTypes: selectedDataTypes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global-fit-export-${Date.now()}.${exportFormat === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('Datos exportados exitosamente!');
      setShowExportModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error exporting data');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBackupSettings = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          isEnabled: backupSettings.isEnabled,
          frequency: backupSettings.frequency,
          backupTime: backupSettings.backupTime,
          retentionDays: backupSettings.retentionDays
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save backup settings');
      }

      const data = await response.json();
      setBackupSettings(data);
      setSuccessMessage('Configuracion de respaldo guardada!');
      setShowBackupModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error saving settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDataType = (dataType: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(dataType)
        ? prev.filter(t => t !== dataType)
        : [...prev, dataType]
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'users-teams', label: 'Usuarios y Equipos', icon: Users },
    { id: 'integrations', label: 'Integraciones', icon: Globe },
    { id: 'data', label: 'Datos', icon: Database },
  ];

  return (
    <PageLayout title="Configuracion" description="Administra la configuracion del sistema">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuracion General
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Gimnasio
                      </label>
                      <input
                        type="text"
                        defaultValue="Global Fit"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zona Horaria
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                        <option>America/Mexico_City</option>
                        <option>America/New_York</option>
                        <option>Europe/Madrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Moneda
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                        <option>MXN - Peso Mexicano</option>
                        <option>USD - Dolar Estadounidense</option>
                        <option>EUR - Euro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Perfil de Usuario
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                        A
                      </div>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                        Cambiar Foto
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          defaultValue="Administrator"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue="admin@globalfit.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Preferencias de Notificaciones
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Nuevos mensajes de clientes', defaultChecked: true },
                      { label: 'Citas programadas', defaultChecked: true },
                      { label: 'Campañas completadas', defaultChecked: false },
                      { label: 'Alertas del sistema', defaultChecked: true },
                      { label: 'Reportes diarios', defaultChecked: false },
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <input
                          type="checkbox"
                          defaultChecked={item.defaultChecked}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-gray-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Configuracion de Seguridad
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contrasena Actual
                      </label>
                      <input
                        type="password"
                        placeholder="********"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nueva Contrasena
                      </label>
                      <input
                        type="password"
                        placeholder="********"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Contrasena
                      </label>
                      <input
                        type="password"
                        placeholder="********"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Integraciones Externas
                  </h3>

                  {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <span className="text-green-700 dark:text-green-400">{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                      <AlertCircle size={20} className="text-red-600" />
                      <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* EVO Integration */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedIntegrations(prev => ({ ...prev, evo: !prev.evo }))}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-left">EVO Gym Software</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sincronizacion de miembros y horarios</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrations.evo?.dns && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Configurado
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            integrations.evo?.is_enabled
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {integrations.evo?.is_enabled ? 'Activo' : 'Inactivo'}
                          </span>
                          {expandedIntegrations.evo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {expandedIntegrations.evo && (
                        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                          {integrations.evo?.configured && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                              <p className="font-medium mb-1">Credenciales Configuradas</p>
                              {integrations.evo.api_key_masked && (
                                <p className="text-xs">API Key: {integrations.evo.api_key_masked}</p>
                              )}
                              {integrations.evo.ai_api_key_masked && (
                                <p className="text-xs">AI API Key: {integrations.evo.ai_api_key_masked}</p>
                              )}
                              <p className="text-xs">Para cambiar, ingresa los nuevos valores abajo</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              DNS / URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://your-evo-instance.com"
                              value={integrations.evo?.dns || ''}
                              onChange={(e) => handleIntegrationChange('evo', 'dns', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              API Key {integrations.evo?.configured && '(Dejar vacio para mantener)'}
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords['evo_api_key'] ? 'text' : 'password'}
                                placeholder="sk_evo_..."
                                value={integrations.evo?.api_key || ''}
                                onChange={(e) => handleIntegrationChange('evo', 'api_key', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => togglePassword('evo_api_key')}
                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                              >
                                {showPasswords['evo_api_key'] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Branch ID (Opcional)
                              </label>
                              <input
                                type="text"
                                placeholder="Branch ID"
                                value={integrations.evo?.branch_id || ''}
                                onChange={(e) => handleIntegrationChange('evo', 'branch_id', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              AI API Key (Opcional) {integrations.evo?.configured && '(Dejar vacio para mantener)'}
                            </label>
                              <div className="relative">
                                <input
                                  type={showPasswords['evo_ai_key'] ? 'text' : 'password'}
                                  placeholder="sk_ai_..."
                                  value={integrations.evo?.ai_api_key || ''}
                                  onChange={(e) => handleIntegrationChange('evo', 'ai_api_key', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePassword('evo_ai_key')}
                                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                >
                                  {showPasswords['evo_ai_key'] ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <button
                              onClick={() => testIntegration('evo')}
                              disabled={testingIntegration === 'evo' || isLoading}
                              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {testingIntegration === 'evo' ? <Loader2 className="inline animate-spin mr-2" size={16} /> : ''}
                              Probar Conexion
                            </button>
                            <button
                              onClick={() => saveIntegration('evo')}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Kapso Integration */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedIntegrations(prev => ({ ...prev, kapso: !prev.kapso }))}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-left">Kapso WhatsApp</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Envio de mensajes via WhatsApp</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrations.kapso?.api_key && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Configurado
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            integrations.kapso?.is_enabled
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {integrations.kapso?.is_enabled ? 'Activo' : 'Inactivo'}
                          </span>
                          {expandedIntegrations.kapso ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {expandedIntegrations.kapso && (
                        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                          {integrations.kapso?.configured && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                              <p className="font-medium mb-1">Credenciales Configuradas</p>
                              <p className="text-xs">API Key: [actual value saved, masked for security]</p>
                              <p className="text-xs">Para cambiar, ingresa los nuevos valores abajo</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              API Key {integrations.kapso?.configured && '(Dejar vacio para mantener)'}
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords['kapso_api_key'] ? 'text' : 'password'}
                                placeholder="sk_kapso_..."
                                value={integrations.kapso?.api_key || ''}
                                onChange={(e) => handleIntegrationChange('kapso', 'api_key', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => togglePassword('kapso_api_key')}
                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                              >
                                {showPasswords['kapso_api_key'] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Webhook Secret (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="webhook_secret"
                              value={integrations.kapso?.webhook_secret || ''}
                              onChange={(e) => handleIntegrationChange('kapso', 'webhook_secret', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Numero de WhatsApp (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="+1234567890"
                              value={integrations.kapso?.whatsapp_number || ''}
                              onChange={(e) => handleIntegrationChange('kapso', 'whatsapp_number', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <button
                              onClick={() => testIntegration('kapso')}
                              disabled={testingIntegration === 'kapso' || isLoading}
                              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {testingIntegration === 'kapso' ? <Loader2 className="inline animate-spin mr-2" size={16} /> : ''}
                              Probar Conexion
                            </button>
                            <button
                              onClick={() => saveIntegration('kapso')}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LLM Integration */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedIntegrations(prev => ({ ...prev, llm: !prev.llm }))}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-left">LLM Provider</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configuracion de proveedores de IA</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrations.llm?.api_key && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Configurado
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            integrations.llm?.is_enabled
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {integrations.llm?.is_enabled ? 'Activo' : 'Inactivo'}
                          </span>
                          {expandedIntegrations.llm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {expandedIntegrations.llm && (
                        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                          {integrations.llm?.configured && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                              <p className="font-medium mb-1">Credenciales Configuradas</p>
                              {integrations.llm.api_key_masked && (
                                <p className="text-xs">API Key: {integrations.llm.api_key_masked}</p>
                              )}
                              <p className="text-xs">Para cambiar, ingresa los nuevos valores abajo</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Proveedor
                            </label>
                            <select
                              value={integrations.llm?.provider || 'deepseek'}
                              onChange={(e) => handleIntegrationChange('llm', 'provider', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            >
                              <option value="deepseek">DeepSeek</option>
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic (Claude)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              API Key {integrations.llm?.configured && '(Dejar vacio para mantener)'}
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords['llm_api_key'] ? 'text' : 'password'}
                                placeholder="sk_..."
                                value={integrations.llm?.api_key || ''}
                                onChange={(e) => handleIntegrationChange('llm', 'api_key', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => togglePassword('llm_api_key')}
                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                              >
                                {showPasswords['llm_api_key'] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Modelo
                            </label>
                            <select
                              value={integrations.llm?.model || ''}
                              onChange={(e) => handleIntegrationChange('llm', 'model', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            >
                              <option value="">Selecciona un modelo</option>
                              {integrations.llm?.provider === 'openai' && (
                                <>
                                  <option value="gpt-4o">GPT-4o</option>
                                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                </>
                              )}
                              {integrations.llm?.provider === 'deepseek' && (
                                <>
                                  <option value="deepseek-chat">DeepSeek Chat</option>
                                  <option value="deepseek-coder">DeepSeek Coder</option>
                                </>
                              )}
                              {integrations.llm?.provider === 'anthropic' && (
                                <>
                                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                  <option value="claude-3-opus-20250219">Claude 3 Opus</option>
                                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Base URL (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://api.deepseek.com"
                              value={integrations.llm?.base_url || ''}
                              onChange={(e) => handleIntegrationChange('llm', 'base_url', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <button
                              onClick={() => testIntegration('llm')}
                              disabled={testingIntegration === 'llm' || isLoading}
                              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {testingIntegration === 'llm' ? <Loader2 className="inline animate-spin mr-2" size={16} /> : ''}
                              Probar Conexion
                            </button>
                            <button
                              onClick={() => saveIntegration('llm')}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users-teams' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestion de Usuarios y Equipos
                  </h3>

                  {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <span className="text-green-700 dark:text-green-400">{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                      <AlertCircle size={20} className="text-red-600" />
                      <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                    </div>
                  )}

                  {/* Teams Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Equipos</h4>
                      <button
                        onClick={() => {
                          setEditingTeam(null);
                          setShowTeamModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all"
                      >
                        <Plus size={16} />
                        <span>Crear Equipo</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teams.map((team) => (
                        <div key={team.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-dark-900">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{team.name}</h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{team.description || 'Sin descripcion'}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingTeam(team);
                                  setShowTeamModal(true);
                                }}
                                className="p-1 text-gray-500 hover:text-primary-500 transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">
                            Creado: {new Date(team.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Usuarios</h4>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setShowUserModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all"
                      >
                        <Plus size={16} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Equipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {users.map((user) => {
                            const userTeam = teams.find(t => t.id === user.team_id);
                            return (
                              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.full_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                                    {user.role.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {userTeam?.name || 'Sin equipo'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    user.is_active
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingUser(user);
                                        setShowUserModal(true);
                                      }}
                                      className="p-1 text-gray-500 hover:text-primary-500 transition-colors"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                      title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gestion de Datos
                  </h3>

                  {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <span className="text-green-700 dark:text-green-400">{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                      <AlertCircle size={20} className="text-red-600" />
                      <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="p-6 bg-gray-50 dark:bg-dark-900 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Exportar Datos</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Descargar toda la informacion en formato CSV o JSON
                          </p>
                        </div>
                        <Download size={24} className="text-primary-500" />
                      </div>
                    </button>
                    <button
                      onClick={() => setShowBackupModal(true)}
                      className="p-6 bg-gray-50 dark:bg-dark-900 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">Respaldo Automatico</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Configurar respaldos automaticos diarios
                      </p>
                      {backupSettings.isEnabled && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Activo - Proximo respaldo: {backupSettings.nextScheduledAt ? new Date(backupSettings.nextScheduledAt).toLocaleDateString() : 'Pendiente'}
                        </p>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userData: any = {
                  email: formData.get('email'),
                  full_name: formData.get('full_name'),
                  role: formData.get('role'),
                  team_id: formData.get('team_id') ? parseInt(formData.get('team_id') as string) : null,
                };

                const password = formData.get('password');
                if (password) userData.password = password;

                if (editingUser) {
                  handleUpdateUser(editingUser.id, userData);
                } else {
                  if (!password) {
                    setErrorMessage('La contrasena es requerida para nuevos usuarios');
                    setTimeout(() => setErrorMessage(''), 3000);
                    return;
                  }
                  handleCreateUser(userData);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  defaultValue={editingUser?.full_name || ''}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser?.email || ''}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {editingUser ? 'Contrasena (dejar vacio para no cambiar)' : 'Contrasena'}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  required={!editingUser}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || 'staff'}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipo
                </label>
                <select
                  name="team_id"
                  defaultValue={editingUser?.team_id || ''}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Sin equipo</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTeam ? 'Editar Equipo' : 'Crear Equipo'}
              </h3>
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setEditingTeam(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const teamData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                };

                if (editingTeam) {
                  handleUpdateTeam(editingTeam.id, teamData);
                } else {
                  handleCreateTeam(teamData);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTeam?.name || ''}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripcion
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTeam?.description || ''}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeamModal(false);
                    setEditingTeam(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editingTeam ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exportar Datos
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Datos a exportar
                </label>
                <div className="space-y-2">
                  {['clients', 'appointments', 'campaigns', 'reminders', 'conversations', 'leads'].map(
                    (dataType) => (
                      <label key={dataType} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDataTypes.includes(dataType)}
                          onChange={() => toggleDataType(dataType)}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-gray-300"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {dataType === 'clients'
                            ? 'Clientes'
                            : dataType === 'appointments'
                            ? 'Citas'
                            : dataType === 'campaigns'
                            ? 'Campanas'
                            : dataType === 'reminders'
                            ? 'Recordatorios'
                            : dataType === 'conversations'
                            ? 'Conversaciones'
                            : 'Leads'}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || selectedDataTypes.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Settings Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Respaldo Automatico
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={backupSettings.isEnabled}
                    onChange={(e) => setBackupSettings({ ...backupSettings, isEnabled: e.target.checked })}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Habilitar respaldos automaticos
                  </span>
                </label>
              </div>

              {backupSettings.isEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frecuencia
                    </label>
                    <select
                      value={backupSettings.frequency}
                      onChange={(e) => setBackupSettings({ ...backupSettings, frequency: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora de respaldo (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={backupSettings.backupTime}
                      onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Retener respaldos por (dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={backupSettings.retentionDays}
                      onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>

                  {backupSettings.lastBackupAt && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium">Ultimo respaldo:</p>
                      <p>{new Date(backupSettings.lastBackupAt).toLocaleString()}</p>
                    </div>
                  )}

                  {backupSettings.nextScheduledAt && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium">Proximo respaldo:</p>
                      <p>{new Date(backupSettings.nextScheduledAt).toLocaleString()}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBackupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBackupSettings}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
