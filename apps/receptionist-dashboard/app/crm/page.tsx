'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Filter, Users, Mail, Phone, X, Loader2, ChevronDown, RefreshCw } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  avatar: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Active', label: 'Activo' },
  { value: 'Pending', label: 'Prospecto' },
  { value: 'Inactive', label: 'Inactivo' },
];

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // Obtener clientes directamente de Evo API (sin usar base de datos)
      const response = await fetch('/api/evo/clients');
      if (!response.ok) throw new Error('Failed to fetch clients from Evo');
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients from Evo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Sincronizar con la API de EVO
      const response = await fetch('/api/evo/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ syncType: 'members' }),
      });
      
      if (!response.ok) {
        console.error('Error syncing with EVO');
      }
      
      // Recargar los clientes
      await fetchClients();
    } catch (err) {
      console.error('Error during sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || '').includes(searchTerm);
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Inactive': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Active': return 'Activo';
      case 'Pending': return 'Prospecto';
      case 'Inactive': return 'Inactivo';
      default: return status;
    }
  };

  return (
    <PageLayout title="CRM" description="Gestión de clientes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar clientes por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer min-w-[180px]"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                <span>Sincronizar</span>
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-500">Cargando clientes...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Users className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter ? 'No se encontraron clientes' : 'No hay clientes aún'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer cliente al sistema'}
            </p>

          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                            {client.avatar?.startsWith('http') ? (
                              <img src={client.avatar} alt={client.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-primary-600 dark:text-primary-400 font-medium">{client.avatar || '?'}</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Mail size={14} className="mr-2" />
                          {client.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Phone size={14} className="mr-2" />
                          {client.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                          {getStatusLabel(client.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.plan ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {client.plan || 'Sin plan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


    </PageLayout>
  );
}




