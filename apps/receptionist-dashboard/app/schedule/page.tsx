'use client';

import { useState, useEffect, useRef } from 'react';
import PageLayout from '../PageLayout';
import { Search, Plus, ChevronLeft, ChevronRight, Clock, Calendar, User, X, Check, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Appointment {
  id: number;
  client: string;
  time: string;
  date: string;
  type: string;
  instructor: string;
  status: string;
  title?: string;
  clientId?: number;
  location?: string;
  notes?: string;
  duration?: number;
}

interface Client {
  id: number;
  name: string;
  phone: string;
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayDate = today.getDate();

  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/frontend/appointments', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/frontend/clients', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDayClick = (day: number) => {
    const selected = new Date(currentYear, currentDate.getMonth(), day);
    setSelectedDate(formatDateForInput(selected));
  };

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const selectedDayAppointments = selectedDate
    ? appointments.filter(apt => apt.date === selectedDate)
    : appointments;

  const displayAppointments = selectedDate ? selectedDayAppointments : appointments;

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return;

    try {
      const response = await fetch('/api/frontend/appointments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ id: deletingAppointment.id }),
      });

      if (response.ok) {
        setDeletingAppointment(null);
        fetchAppointments();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'Error al eliminar'));
      }
    } catch (err) {
      alert('Error al eliminar cita');
    }
  };

  const handleEditAppointment = async (data: Partial<Appointment>) => {
    if (!editingAppointment) return;

    try {
      const response = await fetch('/api/frontend/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ id: editingAppointment.id, ...data }),
      });

      if (response.ok) {
        setEditingAppointment(null);
        fetchAppointments();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'Error al actualizar'));
      }
    } catch (err) {
      alert('Error al actualizar cita');
    }
  };

  return (
    <PageLayout title="Citas" description="Gestion de horarios y citas">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{currentMonth} {currentYear}</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayAppointments = getAppointmentsForDate(day);
                const hasAppointments = dayAppointments.length > 0;
                const isSelected = selectedDate === `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`p-2 text-sm rounded-lg transition-colors relative ${
                      day === todayDate && currentMonth === today.toLocaleString('es-ES', { month: 'long' }) && currentYear === today.getFullYear()
                        ? 'bg-primary-500 text-white'
                        : isSelected
                          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                          : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {day}
                    {hasAppointments && (
                      <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        day === todayDate ? 'bg-white' : 'bg-primary-500'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setSelectedDate(null);
                setShowModal(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all"
            >
              <Plus size={18} />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedDate
                    ? `Citas - ${new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`
                    : 'Todas las Citas'}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Cargando citas...
                </div>
              )}
              {error && (
                <div className="p-6 text-center text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}
              {!loading && !error && displayAppointments.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  {selectedDate ? 'No hay citas para este día' : 'No se encontraron citas'}
                </div>
              )}
              {!loading && !error && displayAppointments.map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{apt.time.split(' ')[0]}</p>
                        <p className="text-xs text-gray-500">{apt.time.split(' ')[1]}</p>
                      </div>
                      <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{apt.client}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{apt.type}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <User size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{apt.instructor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'Confirmed'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {apt.status}
                      </span>
                      <div className="relative group">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                          <MoreVertical size={18} className="text-gray-500" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => setEditingAppointment(apt)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center space-x-2 first:rounded-t-xl"
                          >
                            <Edit size={16} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setDeletingAppointment(apt)}
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <NewAppointmentModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchAppointments();
          }}
        />
      )}

      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          clients={clients}
          onClose={() => setEditingAppointment(null)}
          onSave={handleEditAppointment}
        />
      )}

      {deletingAppointment && (
        <DeleteAppointmentModal
          appointment={deletingAppointment}
          onClose={() => setDeletingAppointment(null)}
          onConfirm={handleDeleteAppointment}
        />
      )}
    </PageLayout>
  );
}

function NewAppointmentModal({ clients, onClose, onCreated }: { clients: Client[]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setSelectedClientName(client.name);
    setSearchQuery(client.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor selecciona un cliente');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/frontend/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ title, date, time, clientId: selectedClientId, location, notes, duration: Number(duration) }),
      });

      if (response.ok) {
        onCreated();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'Error al crear cita'));
      }
    } catch (err) {
      alert('Error al crear cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Cita</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Programar una nueva cita</p>
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
                if (e.target.value === '') {
                  setSelectedClientId(null);
                  setSelectedClientName('');
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Escribe el nombre o teléfono del cliente..."
              required
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
              Título de la Cita
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Entrenamiento personal, Yoga, etc."
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación / Instructor
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Sala 1, Instructor Juan, etc."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duración (minutos)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
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
              disabled={loading || !title || !date || !selectedClientId}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Crear Cita</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAppointmentModal({ appointment, clients, onClose, onSave }: { appointment: Appointment; clients: Client[]; onClose: () => void; onSave: (data: Partial<Appointment>) => void }) {
  const [title, setTitle] = useState(appointment.type);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time.replace(' hrs', ''));
  const [selectedClientId, setSelectedClientId] = useState<number | null>(appointment.clientId || null);
  const [selectedClientName, setSelectedClientName] = useState(appointment.client);
  const [searchQuery, setSearchQuery] = useState(appointment.client);
  const [showDropdown, setShowDropdown] = useState(false);
  const [location, setLocation] = useState(appointment.instructor || '');
  const [notes, setNotes] = useState(appointment.notes || '');
  const [duration, setDuration] = useState(appointment.duration?.toString() || '60');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setSelectedClientName(client.name);
    setSearchQuery(client.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor selecciona un cliente');
      return;
    }
    setLoading(true);

    await onSave({
      title,
      date,
      time,
      clientId: selectedClientId,
      location,
      notes,
      duration: Number(duration),
    });

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Cita</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Modificar detalles de la cita</p>
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
                if (e.target.value === '') {
                  setSelectedClientId(null);
                  setSelectedClientName('');
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Escribe el nombre o teléfono del cliente..."
              required
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
              Título de la Cita
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Entrenamiento personal, Yoga, etc."
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación / Instructor
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Sala 1, Instructor Juan, etc."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duración (minutos)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
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
              disabled={loading || !title || !date || !selectedClientId}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAppointmentModal({ appointment, onClose, onConfirm }: { appointment: Appointment; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Eliminar Cita</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar la cita de <strong>{appointment.client}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {appointment.type} - {appointment.date} {appointment.time}
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
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
