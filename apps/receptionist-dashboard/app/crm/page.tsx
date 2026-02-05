'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Plus, Filter, MoreVertical, Users, Mail, Phone, MapPin, Edit, Trash2, Eye, X, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  avatar: string;
}

export default function CRMPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: '',
    status: 'PENDING',
  });
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/frontend/clients');
        if (!response.ok) throw new Error('Failed to fetch clients');
        const data = await response.json();
        setClients(data);
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [toast]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/frontend/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create client');
      const newClient = await response.json();
      setClients([newClient, ...clients]);
      setShowNewClientModal(false);
      setFormData({ name: '', email: '', phone: '', plan: '', status: 'PENDING' });
      toast.success('Cliente creado', 'El cliente se ha registrado exitosamente');
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Error creando cliente');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async () => {
    if (deleteClientId === null) return;
    try {
      const response = await fetch(`/api/frontend/clients/${deleteClientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      setClients(clients.filter(c => c.id !== deleteClientId));
      toast.success('Cliente eliminado', 'El cliente ha sido eliminado exitosamente');
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Error eliminando cliente');
    } finally {
      setDeleteClientId(null);
      setShowDeleteDialog(false);
    }
  };

  const openDeleteDialog = (clientId: number) => {
    setDeleteClientId(clientId);
    setShowDeleteDialog(true);
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    Inactive: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    Pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  const handleCreateClient = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Por favor completa los campos requeridos');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsCreating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/frontend/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const newClient = await response.json();
      setClients([...clients, newClient]);
      setFormData({ name: '', email: '', phone: '', plan: '', status: 'PENDING' });
      setShowNewClientModal(false);
      setSuccessMessage('Cliente creado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creando cliente');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Estas seguro de que deseas eliminar este cliente?')) return;

    try {
      const response = await fetch(`/api/frontend/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setClients(clients.filter(c => c.id !== clientId));
      setSuccessMessage('Cliente eliminado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error eliminando cliente');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <PageLayout title="CRM" description="Gestion de clientes y relaciones">
      <div className="space-y-6">
        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Eliminar cliente"
          description="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          variant="destructive"
          onConfirm={handleDeleteClient}
        />

        {/* New Client Modal */}
        {showNewClientModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => {
                  setShowNewClientModal(false);
                  setFormData({ name: '', email: '', phone: '', plan: '', status: 'PENDING' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del cliente"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan
                </label>
                <input
                  type="text"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  placeholder="Ej: Premium"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientModal(false);
                    setFormData({ name: '', email: '', phone: '', plan: '', status: 'PENDING' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isCreating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
