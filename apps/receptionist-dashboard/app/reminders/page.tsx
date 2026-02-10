'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '../PageLayout';
import { Search, Plus, Bell, Clock, MessageCircle, AlertCircle, CheckCircle, XCircle, Calendar, Repeat, Send, Users, Settings, List, MoreVertical, Edit, Trash2, Eye, X } from 'lucide-react';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

interface Reminder {
  id: number;
  client: string;
  type: string;
  message: string;
  scheduled_time: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  clientId: number | null;
}

interface ReminderStats {
  pending: number;
  sent_today: number;
  read: number;
  failed: number;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  initials?: string;
}

const statusIcons: Record<string, typeof AlertCircle> = {
  Pending: Clock,
  Sent: CheckCircle,
  Failed: XCircle,
};

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  Sent: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const typeColors: Record<string, string> = {
  appointment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  payment: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  follow_up: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  general: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const typeLabels: Record<string, string> = {
  appointment: 'Cita',
  payment: 'Pago',
  follow_up: 'Seguimiento',
  general: 'General',
  APPOINTMENT: 'Cita',
  PAYMENT: 'Pago',
  FOLLOW_UP: 'Seguimiento',
  GENERAL: 'General',
};

const statusLabels: Record<string, string> = {
  Pending: 'Pendiente',
  Sent: 'Enviado',
  Failed: 'Fallido',
  PENDING: 'Pendiente',
  SENT: 'EnVIADO',
  FAILED: 'Fallido',
};

const getStatusLabel = (status: string) => statusLabels[status] || statusLabels[status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] || status;
const getTypeLabel = (type: string) => typeLabels[type] || typeLabels[type.toLowerCase()] || type;

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface EditReminderData {
  type?: string;
  message?: string;
  sendDate?: string | null;
  endDate?: string | null;
  clientId?: number | null;
}

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchReminders();
    fetchStats();
  }, [statusFilter]);

  const fetchReminders = async () => {
    try {
      const url = statusFilter
        ? `/api/frontend/reminders?status_filter=${statusFilter}`
        : '/api/frontend/reminders';
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/frontend/reminders/stats', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSendReminder = async (reminderId: number) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        fetchReminders();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const handleDeleteReminder = async () => {
    if (!deletingReminder) return;
    
    try {
      const response = await fetch(`/api/reminders/${deletingReminder.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setDeletingReminder(null);
        fetchReminders();
        fetchStats();
      } else {
        const error = await response.json();
        console.error('Error deleting reminder:', error);
        alert('Error al eliminar el recordatorio: ' + (error.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      alert('Error al eliminar el recordatorio');
    }
  };

  const handleEditReminder = async (data: EditReminderData) => {
    if (!editingReminder) return;

    try {
      const response = await fetch(`/api/reminders/${editingReminder.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setEditingReminder(null);
        fetchReminders();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  };

  const filteredReminders = reminders.filter(reminder =>
    reminder.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout title="Recordatorios" description="Gestión de recordatorios y mensajes programados">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="Pending">Pendientes</option>
              <option value="Sent">Enviados</option>
              <option value="Failed">Fallidos</option>
            </select>
            <button
              onClick={() => router.push('/reminders/settings')}
              className="flex items-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all"
            >
              <Settings size={20} />
              <span>Reglas</span>
            </button>
            <button
              onClick={() => setShowTypeModal(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all"
            >
              <Plus size={20} />
              <span>Nuevo Recordatorio</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : stats?.pending || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enviados Hoy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : stats?.sent_today || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <MessageCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Leídos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : stats?.read || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <CheckCircle className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fallidos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : stats?.failed || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">Todos los Recordatorios</h3>
          </div>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Cargando recordatorios...</p>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
                <Bell className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No hay recordatorios aún</p>
              <button
                onClick={() => setShowTypeModal(true)}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg mx-auto transition-all"
              >
                <Plus size={16} />
                <span>Crear Primer Recordatorio</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReminders.map((reminder) => {
                const StatusIcon = statusIcons[reminder.status] || Clock;
                return (
                  <div key={reminder.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 min-w-0 flex-1">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex-shrink-0">
                          <Bell className="text-primary-600 dark:text-primary-400" size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{reminder.client}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColors[reminder.status] || statusColors.Pending}`}>
                              <StatusIcon size={12} />
                              <span>{getStatusLabel(reminder.status)}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[reminder.type] || typeColors.general}`}>
                              {getTypeLabel(reminder.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-dark-900 p-3 rounded-lg break-words whitespace-normal">
                            {reminder.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {reminder.status === 'Pending' && (
                          <button
                            onClick={() => handleSendReminder(reminder.id)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Send size={14} />
                            <span>Enviar</span>
                          </button>
                        )}
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                            <MoreVertical size={20} className="text-gray-500" />
                          </button>
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <button
                              onClick={() => setEditingReminder(reminder)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center space-x-2 first:rounded-t-xl"
                            >
                              <Edit size={16} />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => setDeletingReminder(reminder)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center space-x-2 last:rounded-b-xl"
                            >
                              <Trash2 size={16} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showNewModal && (
          <NewReminderModal
            onClose={() => setShowNewModal(false)}
            onCreated={() => {
              setShowNewModal(false);
              fetchReminders();
              fetchStats();
            }}
          />
        )}

        {showTypeModal && (
          <ReminderTypeModal
            onClose={() => setShowTypeModal(false)}
            onSelectIndividual={() => {
              setShowTypeModal(false);
              setShowNewModal(true);
            }}
            onSelectRule={() => {
              setShowTypeModal(false);
              router.push('/reminders/settings');
            }}
            onSelectScheduled={() => {
              setShowTypeModal(false);
              router.push('/reminders/settings?tab=scheduled');
            }}
          />
        )}

        {editingReminder && (
          <EditReminderModal
            reminder={editingReminder}
            onClose={() => setEditingReminder(null)}
            onSave={handleEditReminder}
          />
        )}

        {deletingReminder && (
          <DeleteConfirmationModal
            reminder={deletingReminder}
            onClose={() => setDeletingReminder(null)}
            onConfirm={handleDeleteReminder}
          />
        )}
      </div>
    </PageLayout>
  );
}

function ReminderTypeModal({
  onClose,
  onSelectIndividual,
  onSelectRule,
  onSelectScheduled,
}: {
  onClose: () => void;
  onSelectIndividual: () => void;
  onSelectRule: () => void;
  onSelectScheduled: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tipo de Recordatorio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecciona el tipo de recordatorio que deseas crear</p>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={onSelectIndividual}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <Users className="text-blue-600 dark:text-blue-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">Recordatorio Individual</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enviar a un cliente específico</p>
              </div>
            </div>
          </button>

          <button
            onClick={onSelectRule}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <Settings className="text-green-600 dark:text-green-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">Regla Automática</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enviar automáticamente a todos los clientes que cumplan condiciones</p>
              </div>
            </div>
          </button>

          <button
            onClick={onSelectScheduled}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <List className="text-purple-600 dark:text-purple-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">Ver Programados</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ver todos los recordatorios y reglas programadas</p>
              </div>
            </div>
          </button>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function NewReminderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [type, setType] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/evo/search-members?name=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Error searching members:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSelectedClientName(client.name);
    setSearchQuery(client.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/frontend/reminders', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          message: message,
          sendDate: sendDate ? new Date(sendDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          clientId: selectedClientId,
          channel: 'whatsapp',
        }),
      });

      if (response.ok) {
        onCreated();
      } else {
        const errorData = await response.json();
        console.error('Failed to create reminder:', errorData);
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nuevo Recordatorio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura un nuevo recordatorio</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Cliente
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (e.target.value === '') {
                  setSelectedClientId(null);
                  setSelectedClientName('');
                  setSearchResults([]);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Escribe el nombre del cliente..."
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
            {showDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    Buscando...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                        {client.photoUrl ? (
                          <img src={client.photoUrl} alt={client.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                            {client.initials || client.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Recordatorio
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="GENERAL">General</option>
              <option value="APPOINTMENT">Cita</option>
              <option value="PAYMENT">Pago</option>
              <option value="FOLLOW_UP">Seguimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Recuerda tu cita mañana a las 10am..."
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Envío
            </label>
            <input
              type="date"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin (Opcional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
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
              disabled={isSubmitting || !type || !message || !sendDate}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Recordatorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditReminderModal({ reminder, onClose, onSave }: { reminder: Reminder; onClose: () => void; onSave: (data: EditReminderData) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState(reminder.client);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [type, setType] = useState(reminder.type || 'GENERAL');
  const [message, setMessage] = useState(reminder.message);
  const [sendDate, setSendDate] = useState(reminder.scheduled_time ? new Date(reminder.scheduled_time).toISOString().slice(0, 10) : '');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/frontend/clients', { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSearchQuery(client.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    onSave({
      type: type,
      message: message,
      sendDate: sendDate ? new Date(sendDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      clientId: selectedClientId,
    });

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Recordatorio</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Modifica los detalles del recordatorio</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Cliente
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Escribe el nombre o teléfono del cliente..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
            {showDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Recordatorio
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="GENERAL">General</option>
              <option value="APPOINTMENT">Cita</option>
              <option value="PAYMENT">Pago</option>
              <option value="FOLLOW_UP">Seguimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Recuerda tu cita mañana a las 10am..."
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Envío
            </label>
            <input
              type="date"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin (Opcional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
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
              disabled={isSubmitting || !type || !message || !sendDate}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ reminder, onClose, onConfirm }: { reminder: Reminder; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Trash2 className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Eliminar Recordatorio</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar el recordatorio <strong>{reminder.client}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Mensaje: {reminder.message}
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 size={18} />
                <span>Eliminar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
