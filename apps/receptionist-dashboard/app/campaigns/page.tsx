'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Plus, Send, Clock, Users, BarChart3, Play, Pause, MoreVertical, Edit2, Trash2, Calendar, Image, Video, FileText, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { getSession } from 'next-auth/react';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  status: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  delivery_rate: number;
  scheduled_date: string | null;
  created_at: string;
  startDate: string | null;
  endDate: string | null;
}

interface CampaignStats {
  total: number;
  active: number;
  completed: number;
  scheduled: number;
  total_sent: number;
  total_delivered: number;
  delivery_rate: number;
}

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  Scheduled: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  Completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Paused: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  Active: 'Activa',
  Scheduled: 'Programada',
  Completed: 'Completada',
  Paused: 'Pausada',
  Draft: 'Borrador',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [session, setSession] = useState<any>(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    getSession().then(session => setSession(session));
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    getSession().then(session => setSession(session));
  }, []);

  const fetchCampaigns = async () => {
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
      const response = await fetch('/api/frontend/campaigns', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend received campaigns:', data.length, data);
        setCampaigns(data);
      } else {
        console.error('Failed to fetch campaigns:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
      const response = await fetch('/api/frontend/campaigns/stats', { headers });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLaunchCampaign = async (campaignId: number) => {
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
      const response = await fetch(`/api/campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers,
      });
      if (response.ok) {
        fetchCampaigns();
        fetchStats();
        success('Campaña lanzada', 'La campaña ha sido lanzada exitosamente.');
      } else {
        error('Error al lanzar', 'No se pudo lanzar la campaña.');
      }
    } catch (err) {
      console.error('Failed to launch campaign:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const updateCampaign = async (campaignId: number, updatedData: Partial<Campaign>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        fetchCampaigns();
        fetchStats();
        success('Campaña actualizada', 'Los cambios se han guardado exitosamente.');
      } else {
        error('Error al actualizar', 'No se pudo actualizar la campaña.');
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };


  const deleteCampaign = async (campaignId: number) => {
    try {
      const response = await fetch(`/api/frontend/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShowDeleteDialog(null);
        fetchCampaigns();
        fetchStats();
        success('Campaña eliminada', 'La campaña ha sido eliminada exitosamente.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        error('Error al eliminar', errorData.message || 'No se pudo eliminar la campaña.');
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout title="Campañas" description="Gestión de campañas de marketing">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar campañas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns/settings"
              className="flex items-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 border border-gray-300 dark:hover:bg-emerald-500/30 text-gray-900 dark:text-emerald-300 rounded-xl transition-all"
            >
              <Settings size={20} />
              <span>Reglas</span>
            </Link>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all"
            >
              <Plus size={20} />
              <span>Nueva Campaña</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Campañas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : stats?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Send className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enviados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : (stats?.total_sent || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Clock className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Entregados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : (stats?.total_delivered || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Users className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tasa Entrega</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {isLoading ? '-' : `${stats?.delivery_rate || 0}%`}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <BarChart3 className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Todas las Campañas</h3>
          </div>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Cargando campañas...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
                <Send className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No hay campañas aún</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg mx-auto transition-all"
              >
                <Plus size={16} />
                <span>Crear Primera Campaña</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Send className="text-primary-600 dark:text-primary-400" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {campaign.scheduled_date ? `Programada: ${campaign.scheduled_date}` : 'Envío inmediato'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{campaign.sent_count}</p>
                        <p className="text-xs text-gray-500">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{campaign.delivered_count}</p>
                        <p className="text-xs text-gray-500">Entregados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{campaign.read_count}</p>
                        <p className="text-xs text-gray-500">Leídos</p>
                      </div>
                      {/* Status tag disabled for now
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.Draft}`}>
                        {statusLabels[campaign.status] || campaign.status}
                      </span>
                      */}
                      <div className="flex items-center space-x-2">
                        {campaign.status === 'Active' && (
                          <button
                            onClick={() => handleLaunchCampaign(campaign.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors text-green-600"
                            title="Lanzar campaña"
                          >
                            <Play size={18} />
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                              <MoreVertical size={18} className="text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={"end"}>
                            <DropdownMenuItem
                              onClick={() => setShowEditModal(campaign.id)}
                              className="flex items-center space-x-2"
                            >
                              <Edit2 size={16} />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setShowDeleteDialog(campaign.id)}
                              className="flex items-center space-x-2"
                            >
                              <Trash2 size={16} />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showNewModal && (
          <NewCampaignModal
            onClose={() => setShowNewModal(false)}
            onCreated={() => {
              setShowNewModal(false);
              fetchCampaigns();
              fetchStats();
            }}
          />
        )}

        {showEditModal && (
          <EditCampaignModal
            campaignId={showEditModal}
            onClose={() => setShowEditModal(null)}
            onUpdated={() => {
              setShowEditModal(null);
              fetchCampaigns();
              fetchStats();
            }}
          />
        )}

        {showDeleteDialog && (
          <ConfirmDialog
            open={!!showDeleteDialog}
            onOpenChange={(open) => !open && setShowDeleteDialog(null)}
            title="Eliminar Campaña"
            description="¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => deleteCampaign(showDeleteDialog)}
            variant="destructive"
          />
        )}
      </div>
    </PageLayout>
  );
}

function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableSegments] = useState([
    { id: 'all', label: 'Todos los clientes' },
    { id: 'students', label: 'Estudiantes' },
    { id: 'professionals', label: 'Profesionales' },
    { id: 'public', label: 'Público General' },
    { id: 'premium', label: 'Miembros Premium' },
    { id: 'inactive', label: 'Inactivos' },
  ]);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/frontend/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          template_content: content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          target_segments: selectedSegments.length > 0 ? selectedSegments : ['all'],
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (response.ok) {
        success('Campaña creada', 'La campaña se ha guardado exitosamente.');
        onCreated();
      } else {
        const errorData = await response.json().catch(() => ({}));
        error('Error al crear', errorData.message || 'No se pudo crear la campaña.');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Campaña</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea una nueva campaña de marketing</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la campaña
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Promoción de Verano"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve de la campaña..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hola {nombre}, teitamos una oferta especial..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Usa {'{nombre}'}, {'{plan}'}, {'{phone}'} para personalización</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Enviar a (Segmentos)
            </label>
            <div className="space-y-2">
              {availableSegments.map((segment) => (
                <label key={segment.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(segment.id)}
                    onChange={() => toggleSegment(segment.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{segment.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">ID: {segment.id}</span>
                </label>
              ))}
            </div>
            {selectedSegments.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Se enviará a todos los clientes si no se selecciona ninguno</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Multimedia (opcional)
            </label>
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setMediaType(mediaType === 'image' ? '' : 'image')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${mediaType === 'image' ? 'bg-primary-100 border-primary-500 text-primary-600' : 'border-gray-300 dark:border-gray-600'}`}
              >
                <Image size={16} />
                <span>Imagen</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType(mediaType === 'video' ? '' : 'video')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${mediaType === 'video' ? 'bg-primary-100 border-primary-500 text-primary-600' : 'border-gray-300 dark:border-gray-600'}`}
              >
                <Video size={16} />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType(mediaType === 'document' ? '' : 'document')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${mediaType === 'document' ? 'bg-primary-100 border-primary-500 text-primary-600' : 'border-gray-300 dark:border-gray-600'}`}
              >
                <FileText size={16} />
                <span>Documento</span>
              </button>
            </div>
            {mediaType && (
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={`URL del ${mediaType}`}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            )}
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
              disabled={isSubmitting || !name || !content}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCampaignModal({ 
  campaignId, 
  onClose, 
  onUpdated 
}: { 
  campaignId: number; 
  onClose: () => void; 
  onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({});
  const { success, error } = useToast();

  const availableSegments = [
    { id: 'all', label: 'Todos los clientes' },
    { id: 'students', label: 'Estudiantes' },
    { id: 'professionals', label: 'Profesionales' },
    { id: 'public', label: 'Público General' },
    { id: 'premium', label: 'Miembros Premium' },
    { id: 'inactive', label: 'Inactivos' },
  ];

  useEffect(() => {
    const fetchCampaign = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/frontend/campaigns/${campaignId}`);
        if (response.ok) {
          const campaign = await response.json();
          console.log('Campaign loaded:', campaign);
          setName(campaign.name || '');
          setDescription(campaign.description || '');
          setContent(campaign.content || '');
          setStartDate(campaign.startDate ? campaign.startDate.split('T')[0] : '');
          setEndDate(campaign.endDate ? campaign.endDate.split('T')[0] : '');
        } else {
          console.error('Failed to load campaign:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch campaign:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'El nombre de la campaña es obligatorio.';
    } else if (name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
    } else if (name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/frontend/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          content: content.trim() || null,
          target_segments: selectedSegments.length > 0 ? selectedSegments : ['all'],
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (response.ok) {
        success('Campaña actualizada', 'Los cambios se han guardado exitosamente.');
        onUpdated();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrors({ general: errorData.message || 'Error al actualizar la campaña.' });
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Campaña</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Modifica los detalles de tu campaña</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Cargando campaña...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la campaña *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Promoción de Verano"
              required
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
              } bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 outline-none transition-colors`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los objetivos de tu campaña..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje / Contenido
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hola {nombre}, tenemos una oferta especial..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Usa {'{nombre}'}, {'{plan}'}, {'{phone}'} para personalización</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Enviar a (Segmentos)
            </label>
            <div className="space-y-2">
              {availableSegments.map((segment) => (
                <label key={segment.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(segment.id)}
                    onChange={() => toggleSegment(segment.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{segment.label}</span>
                </label>
              ))}
            </div>
            {selectedSegments.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Se enviará a todos los clientes si no se selecciona ninguno</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
