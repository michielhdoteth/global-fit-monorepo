'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Plus, ChevronLeft, ChevronRight, Clock, Calendar, User } from 'lucide-react';

interface Appointment {
  id: number;
  client: string;
  time: string;
  date: string;
  type: string;
  instructor: string;
  status: string;
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayDate = today.getDate();

  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/frontend/appointments');
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

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
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    day === todayDate && currentMonth === today.toLocaleString('es-ES', { month: 'long' }) && currentYear === today.getFullYear()
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <button className="w-full flex items-center justify-center space-x-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all">
              <Plus size={18} />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-dark-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Hoy - {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar citas..."
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
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
              {!loading && !error && appointments.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron citas
                </div>
              )}
              {!loading && !error && appointments.map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
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
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'Confirmed'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {apt.status}
                      </span>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                        <Plus size={18} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
